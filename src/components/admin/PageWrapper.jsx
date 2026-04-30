function PageWrapper({ title, children }) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      
      <h1 className="text-xl font-semibold mb-4 text-black">
        {title}
      </h1>

      {children}

    </div>
  );
}

export default PageWrapper;