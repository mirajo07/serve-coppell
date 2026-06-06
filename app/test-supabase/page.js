import { supabase } from "@/lib/supabase";

export default async function TestSupabasePage() {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*");

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Supabase Test</h1>

      {error ? (
        <>
          <h2>Error</h2>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </>
      ) : (
        <>
          <h2>Success</h2>
          <p>Connected to Supabase.</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </>
      )}
    </main>
  );
}