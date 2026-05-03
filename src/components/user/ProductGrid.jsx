import ProductCard from "./ProductCard";

function ProductGrid({ products, loading, onProtectedAction }) {
  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!products || products.length === 0) {
    return <div className="text-center py-10">No Products Found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {(products || [])
        .filter(Boolean) // ✅ remove undefined/null
        .map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onProtectedAction={onProtectedAction}
          />
        ))}
    </div>
  );
}

export default ProductGrid;