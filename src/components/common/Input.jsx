function Input({ type = "text", name, placeholder, value, onChange }) {
  return (
    <input
      type={type}
      name={name}   // 🔥 add this
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="border border-gray-300 p-2 w-full rounded focus:outline-none"
    />
  );
}

export default Input;