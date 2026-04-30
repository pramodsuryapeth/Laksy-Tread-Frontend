function Button({ children, onClick, type = "primary" }) {
  const base = "px-4 py-2 rounded font-medium";

  const styles =
    type === "primary"
      ? "bg-black text-white hover:bg-gray-900"
      : "border border-black text-black";

  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export default Button;