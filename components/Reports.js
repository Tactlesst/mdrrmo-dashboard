export default function Reports() {
  return (
    <div className="flex flex-col p-6 bg-gray-100 font-serif min-h-screen">
      <h2 className="text-xl font-bold mb-4">Accident Reports & Analytics</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <ReportCard title="Monthly Accident Summary" color="blue" />
        <ReportCard title="High-Risk Area Analysis" color="green" />
        <ReportCard title="Severity Distribution" color="yellow" />
      </div>
    </div>
  )
}

function ReportCard({ title, color }) {
  return (
    <div className={`p-4 border-l-4 border-${color}-500 bg-${color}-50 rounded`}>
      <h3 className={`text-${color}-800 font-semibold`}>{title}</h3>
      <p className={`text-${color}-700 text-sm mt-1`}>View statistics and reports.</p>
      <button className={`mt-2 px-3 py-1 bg-${color}-600 text-white rounded hover:bg-${color}-700`}>
        View
      </button>
    </div>
  )
}
