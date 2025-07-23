export default function AccidentList() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Road Accident Incidents</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 border rounded shadow-sm">
            <h3 className="font-semibold text-lg">Incident #{1000 + i}</h3>
            <p>Date: 2024-07-{10 + i}</p>
            <p>Location: Brgy. Poblacion</p>
            <p>Severity: {i % 2 === 0 ? 'Minor' : 'Moderate'}</p>
            <button className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
