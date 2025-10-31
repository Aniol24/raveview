export default function SetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section className="container mx-auto px-4">{children}</section>
}

export const metadata = {
  title: "RAVEVIEW – Set",
}
