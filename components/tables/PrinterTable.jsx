export default function PrinterTable({ printers }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">Printer</th>
          <th className="text-left p-2">Status</th>
          <th className="text-left p-2">Pages Today</th>
          <th className="text-left p-2">Ink</th>
        </tr>
      </thead>
      <tbody>
        {printers.map(printer => (
          <tr key={printer.id} className="border-b hover:bg-gray-50">
            <td className="p-2">{printer.name}</td>
            <td className="p-2">
              <span className={`px-2 py-1 rounded text-xs ${
                printer.status === "READY" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {printer.status}
              </span>
            </td>
            <td className="p-2">{printer.pagesToday || 0}</td>
            <td className="p-2">
              {printer.inkLevels ? (
                <span className="text-sm">
                  {Object.values(printer.inkLevels)[0]}%
                </span>
              ) : "N/A"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}