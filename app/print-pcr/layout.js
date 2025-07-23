export const metadata = {
  title: 'Print PCR',
};

export default function PrintLayout({ children }) {
  return (
    <html lang="en">
      <body className="print-pcr">
        {children}
      </body>
    </html>
  );
}
