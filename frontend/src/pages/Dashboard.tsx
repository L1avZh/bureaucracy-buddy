export default function Dashboard() {
  /* state / fetch omitted for brevity */
  return (
    <main className="p-4 grid gap-4">
      {docs.map((d) => (
        <article
          key={d.id}
          className="bg-white rounded-xl shadow p-4 flex flex-col gap-2"
        >
          <h2 className="text-xl font-bold">
            {labels[d.kind] /* דרכון, רישיון נהיגה ... */}
          </h2>
          <p>תוקף עד {new Date(d.expires_at).toLocaleDateString("he-IL")}</p>
        </article>
      ))}
    </main>
  );
}
