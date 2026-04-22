// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Button({ children, ...props }: any) {
  return (
    <button
      {...props}
      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
    >
      {children}
    </button>
  )
}