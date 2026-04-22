// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Card({ children }: any) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      {children}
    </div>
  )
}