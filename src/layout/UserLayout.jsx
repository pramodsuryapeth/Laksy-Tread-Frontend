import UserHeader from "../components/user/UserHeader";

function UserLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <main className="p-6">
        {children}
      </main>
    </div>
  );
}

export default UserLayout;