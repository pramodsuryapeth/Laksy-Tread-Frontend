function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Profile</h2>

      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>
    </div>
  );
}

export default Profile;