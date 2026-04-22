// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Input(props: any) {
  return (
    <input
      {...props}
      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}