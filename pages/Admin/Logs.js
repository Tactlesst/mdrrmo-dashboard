// pages/logs.js
export default function LogsTable() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow p-6 max-w-4xl mx-auto">
        {/* Header and Export */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Logs Table</h2>
            <p className="text-sm text-gray-600">Records of all past responses by responder.</p>
          </div>
          <div className="text-sm text-right space-x-2">
            <span className="text-gray-700">Export Options:</span>
            <a href="#" className="text-blue-600 hover:underline">CSV</a>
            <a href="#" className="text-blue-600 hover:underline">PDF</a>
          </div>
        </div>

        {/* Filters inside table card */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h3 className="text-md font-semibold flex items-center gap-2 mb-3">
            <span role="img" aria-label="search">🔍</span> Filters
          </h3>
          <form className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-gray-700 mb-1">Date Range</label>
              <input type="date" className="w-full rounded-md border border-gray-300 p-2" />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Emergency Type</label>
              <select className="w-full rounded-md border border-gray-300 p-2">
                <option>All</option>
                <option>Medical</option>
                <option>Fire</option>
                <option>Police</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Outcome Status</label>
              <select className="w-full rounded-md border border-gray-300 p-2">
                <option>All</option>
                <option>Resolved</option>
                <option>Cancelled</option>
                <option>Pending</option>
              </select>
            </div>
          </form>
        </div>

        {/* Table */}
        <table className="w-full text-sm text-left border-t border-gray-200">
          <thead>
            <tr className="text-gray-600">
              <th className="py-2">Date</th>
              <th className="py-2">Type</th>
              <th className="py-2">Location</th>
              <th className="py-2">Status</th>
              <th className="py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="py-2">July 12</td>
              <td className="py-2">Medical</td>
              <td className="py-2">Brgy. Baliwagan</td>
              <td className="py-2 flex items-center gap-1 text-green-600">
                ✅ <span>Resolved</span>
              </td>
              <td className="py-2">CPR performed</td>
            </tr>
            <tr className="border-t">
              <td className="py-2">July 11</td>
              <td className="py-2">Fire</td>
              <td className="py-2">Brgy. Quezon</td>
              <td className="py-2 flex items-center gap-1 text-red-600">
                🚫 <span>Cancelled</span>
              </td>
              <td className="py-2">False alarm</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
