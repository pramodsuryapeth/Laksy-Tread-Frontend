import { useNavigate } from "react-router-dom";

function UserAvatar({ user }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/profile")}
      className="flex items-center gap-2 cursor-pointer"
    >
      {/* Avatar circle */}
      <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">
        {user?.email?.charAt(0).toUpperCase() || "U"}
      </div>

      {/* Email */}
      <span className="text-sm text-gray-700 hidden sm:block">
        {user?.email || "Guest"}
      </span>
    </div>
  );
}

export default UserAvatar;