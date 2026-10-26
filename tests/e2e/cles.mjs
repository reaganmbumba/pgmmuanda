// Génère les clés « anon » et « service_role » (JWT HS256) du Supabase local.
import { createHmac } from "node:crypto";

const secret = process.argv[2];
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (role) => {
  const corps = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ role, iss: "supabase-e2e", exp: 4102444800 })}`;
  return `${corps}.${createHmac("sha256", secret).update(corps).digest("base64url")}`;
};
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${jwt("anon")}\nSUPABASE_SERVICE_ROLE_KEY=${jwt("service_role")}`);
