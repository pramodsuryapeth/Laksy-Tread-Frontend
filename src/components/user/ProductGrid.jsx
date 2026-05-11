import ProductCard from "./ProductCard";
import Loader from "../common/Loader";

function ProductGrid({ products, loading, onProtectedAction }) {
  if (loading) return <Loader />;
  if (!products || products.length === 0) return <Loader />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
      {(products || [])
        .filter(Boolean)
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