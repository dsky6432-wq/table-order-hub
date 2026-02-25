import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QrCode, ShoppingCart, Plus, Minus, X, CreditCard, Banknote, Send } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  available: boolean;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface RestaurantTable {
  id: string;
  table_number: number;
  user_id: string;
}

interface Profile {
  restaurant_name: string;
  restaurant_description: string | null;
  logo_url: string | null;
  menu_theme: "default" | "dark" | "warm" | "ocean";
}

const formatRSD = (value: number) =>
  new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const menuThemeClassMap: Record<Profile["menu_theme"], string> = {
  default: "",
  dark: "menu-theme-dark",
  warm: "menu-theme-warm",
  ocean: "menu-theme-ocean",
};

const MenuPage = () => {
  const { token } = useParams<{ token: string }>();
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [customerNote, setCustomerNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  useEffect(() => {
    if (token) loadMenu();
  }, [token]);

  const loadMenu = async () => {
    // Find the table by QR token
    const { data: tableData, error: tableError } = await supabase
      .from("restaurant_tables")
      .select("*")
      .eq("qr_code_token", token!)
      .single();

    if (tableError || !tableData) {
      setLoading(false);
      return;
    }
    setTable(tableData);

    // Fetch restaurant profile, categories, and products in parallel
    const [profileRes, categoriesRes, productsRes] = await Promise.all([
      supabase.from("profiles").select("restaurant_name, restaurant_description, logo_url, menu_theme").eq("user_id", tableData.user_id).single(),
      supabase.from("categories").select("*").eq("user_id", tableData.user_id).order("sort_order"),
      supabase.from("products").select("*").eq("user_id", tableData.user_id).eq("available", true).order("sort_order"),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeThemeClass = profile ? menuThemeClassMap[profile.menu_theme] : "";

  const submitOrder = async () => {
    if (!table || cart.length === 0) return;
    setSubmitting(true);

    const orderId = crypto.randomUUID();
    const { error: orderError } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        restaurant_user_id: table.user_id,
        table_id: table.id,
        table_number: table.table_number,
        total: totalPrice,
        payment_method: paymentMethod,
        customer_note: customerNote || null,
      });

    if (orderError) {
      toast.error("Greška pri slanju porudžbine.");
      setSubmitting(false);
      return;
    }

    const items = cart.map((item) => ({
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(items);
    if (itemsError) {
      toast.error("Greška pri dodavanju stavki.");
      setSubmitting(false);
      return;
    }

    setOrderSent(true);
    setCart([]);
    setShowCart(false);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Učitavanje menija...</div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <QrCode className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">Meni nije pronađen</h1>
        <p className="mt-2 text-muted-foreground">QR kod je nevažeći ili je istekao.</p>
      </div>
    );
  }

  if (orderSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent">
          <ShoppingCart className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-bold text-foreground">Porudžbina poslata!</h1>
        <p className="mt-2 text-muted-foreground">
          Vaša porudžbina za Sto {table.table_number} je primljena. Restoran je obavešteni.
        </p>
        <Button variant="hero" className="mt-6" onClick={() => setOrderSent(false)}>
          Naruči ponovo
        </Button>
      </div>
    );
  }

  const groupedProducts = categories.map((cat) => ({
    ...cat,
    products: products.filter((p) => p.category_id === cat.id),
  }));
  const uncategorized = products.filter((p) => !p.category_id);

  return (
    <div className={`min-h-screen bg-background pb-24 ${activeThemeClass}`}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-heading text-lg font-bold text-foreground">
              {profile?.restaurant_name || "Meni"}
            </h1>
            <p className="text-xs text-muted-foreground">Sto {table.table_number}</p>
          </div>
          {totalItems > 0 && (
            <Button variant="hero" size="sm" onClick={() => setShowCart(true)}>
              <ShoppingCart className="mr-1 h-4 w-4" />
              {totalItems} · {formatRSD(totalPrice)}
            </Button>
          )}
        </div>
      </header>

      {/* Menu */}
      <main className="mx-auto max-w-lg px-4 py-6">
        {profile?.restaurant_description && (
          <p className="mb-6 text-sm text-muted-foreground">{profile.restaurant_description}</p>
        )}

        {groupedProducts.map((group) =>
          group.products.length > 0 ? (
            <div key={group.id} className="mb-8">
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">{group.name}</h2>
              <div className="space-y-3">
                {group.products.map((product) => (
                  <ProductCard key={product.id} product={product} cart={cart} onAdd={addToCart} onUpdate={updateQuantity} />
                ))}
              </div>
            </div>
          ) : null
        )}

        {uncategorized.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Ostalo</h2>
            <div className="space-y-3">
              {uncategorized.map((product) => (
                <ProductCard key={product.id} product={product} cart={cart} onAdd={addToCart} onUpdate={updateQuantity} />
              ))}
            </div>
          </div>
        )}

        {products.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Meni je trenutno prazan.</p>
          </div>
        )}
      </main>

      {/* Cart Overlay */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-t-2xl border-t border-border bg-card p-6 shadow-card-hover animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-foreground">Vaša korpa</h2>
              <button onClick={() => setShowCart(false)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="max-h-60 space-y-3 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatRSD(Number(item.product.price))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border hover:bg-muted">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border hover:bg-muted">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Method */}
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-foreground">Način plaćanja</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    paymentMethod === "cash" ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Banknote className="h-4 w-4" /> Gotovina
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    paymentMethod === "card" ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Kartica
                </button>
              </div>
            </div>

            {/* Note */}
            <textarea
              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              placeholder="Napomena (opciono)..."
              rows={2}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
            />

            {/* Total & Submit */}
            <div className="mt-4 flex items-center justify-between">
              <span className="font-heading text-xl font-bold text-foreground">{formatRSD(totalPrice)}</span>
              <Button variant="hero" size="lg" onClick={submitOrder} disabled={submitting}>
                <Send className="mr-1 h-4 w-4" />
                {submitting ? "Šalje se..." : "Pošalji porudžbinu"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCard = ({
  product,
  cart,
  onAdd,
  onUpdate,
}: {
  product: Product;
  cart: CartItem[];
  onAdd: (p: Product) => void;
  onUpdate: (id: string, delta: number) => void;
}) => {
  const cartItem = cart.find((item) => item.product.id === product.id);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
      {product.image_url && (
        <img src={product.image_url} alt={product.name} className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{product.name}</p>
        {product.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        <p className="mt-1 font-heading text-sm font-bold text-primary">{formatRSD(Number(product.price))}</p>
      </div>
      {cartItem ? (
        <div className="flex items-center gap-2">
          <button onClick={() => onUpdate(product.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted">
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-6 text-center text-sm font-semibold text-foreground">{cartItem.quantity}</span>
          <button onClick={() => onUpdate(product.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button onClick={() => onAdd(product)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground">
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default MenuPage;
