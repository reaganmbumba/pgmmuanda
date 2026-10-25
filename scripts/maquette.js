// Interactions de la version HTML statique (sans React).
(function () {
  // Menu latéral staff sur téléphone
  var aside = document.querySelector("aside");
  document.querySelectorAll('[aria-label="Ouvrir le menu"]').forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      if (aside) aside.classList.add("menu-ouvert");
    });
  });
  document.addEventListener("click", function (e) {
    if (aside && aside.classList.contains("menu-ouvert") && !aside.contains(e.target))
      aside.classList.remove("menu-ouvert");
  });

  // Afficher / masquer le mot de passe
  document.querySelectorAll('[aria-label="Afficher le mot de passe"]').forEach(function (b) {
    b.addEventListener("click", function () {
      var i = document.getElementById("mdp");
      i.type = i.type === "password" ? "text" : "password";
    });
  });

  // Formulaire de connexion
  var mdp = document.getElementById("mdp");
  if (mdp) {
    mdp.form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (document.getElementById("msg-demo")) return;
      var p = document.createElement("p");
      p.id = "msg-demo";
      p.className = "rounded-xl bg-or-100 p-3 text-xs text-or-600";
      p.textContent =
        "Maquette : la connexion réelle sera branchée à l'Étape 2. Utilisez les accès de démonstration ci-dessous.";
      mdp.form.appendChild(p);
    });
  }

  // Recherche et filtres des membres
  var recherche = document.querySelector('input[placeholder="Nom, matricule ou téléphone"]');
  if (recherche) {
    var selects = recherche.closest("div").parentElement.querySelectorAll("select");
    var lignes = document.querySelectorAll("tbody tr, ul.md\\:hidden > li");
    var compteur = Array.from(document.querySelectorAll("p")).find(function (p) {
      return / membres? sur /.test(p.textContent);
    });
    var total = document.querySelectorAll("tbody tr").length;
    var filtrer = function () {
      var q = recherche.value.trim().toLowerCase();
      var n = 0;
      lignes.forEach(function (l) {
        var t = l.textContent;
        var ok = (!q || t.toLowerCase().indexOf(q) >= 0);
        selects.forEach(function (s) {
          if (s.value && s.selectedIndex > 0) {
            var re = new RegExp("(^|[^A-Za-zÀ-ÿ])" + s.value + "($|[^A-Za-zÀ-ÿ])");
            if (!re.test(t)) ok = false;
          }
        });
        l.style.display = ok ? "" : "none";
        if (ok && l.tagName === "TR") n++;
      });
      if (compteur) compteur.textContent = n + " membre" + (n > 1 ? "s" : "") + " sur " + total;
    };
    recherche.addEventListener("input", filtrer);
    selects.forEach(function (s) { s.addEventListener("change", filtrer); });
  }

  // Scanner : recherche manuelle par matricule
  var champ = document.getElementById("matricule");
  if (champ) {
    var refs = window.__REFS__ || {};
    champ.form.addEventListener("submit", function (e) {
      e.preventDefault();
      var r = refs[champ.value.trim().toUpperCase()];
      window.location.href = "verifier-" + (r || "inconnue") + ".html";
    });
  }
})();
