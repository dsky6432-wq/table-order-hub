import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { QrCode, LogOut, ShoppingCart, UtensilsCrossed, LayoutDashboard, Plus, Table } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Order {
  id: string;
  table_number: number | null;
  status: string;
  payment_method: string;
  total: number;
  customer_note: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  available: boolean;
}

type Tab = "orders" | "menu" | "tables";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tableCount, setTableCount] = useState(0);

  // New item form
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", category_id: "" });
  const [newTableCount, setNewTableCount] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchOrders();
    fetchCategories();
    fetchProducts();
    fetchTables();

    // Realtime orders
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_user_id=eq.${user.id}` },
        (payload) => {
          setOrders((prev) => [payload.new as Order, ...prev]);
          toast.info("Nova porudžbina!", { description: `Sto ${(payload.new as Order).table_number}` });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setOrders(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("sort_order");
    if (data) setProducts(data);
  };

  const fetchTables = async () => {
    const { count } = await supabase.from("restaurant_tables").select("*", { count: "exact", head: true });
    setTableCount(count ?? 0);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: newCategoryName, user_id: user!.id, sort_order: categories.length });
    if (error) { toast.error(error.message); return; }
    setNewCategoryName("");
    fetchCategories();
    toast.success("Kategorija dodata!");
  };

  const addProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price) return;
    const { error } = await supabase.from("products").insert({
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price),
      category_id: newProduct.category_id || null,
      user_id: user!.id,
      sort_order: products.length,
    });
    if (error) { toast.error(error.message); return; }
    setNewProduct({ name: "", description: "", price: "", category_id: "" });
    fetchProducts();
    toast.success("Proizvod dodat!");
  };

  const generateTables = async () => {
    const count = parseInt(newTableCount);
    if (!count || count < 1) return;
    const tables = Array.from({ length: count }, (_, i) => ({
      user_id: user!.id,
      table_number: tableCount + i + 1,
    }));
    const { error } = await supabase.from("restaurant_tables").insert(tables);
    if (error) { toast.error(error.message); return; }
    setNewTableCount("");
    fetchTables();
    toast.success(`${count} stolova generisano!`);
  };

  type OrderStatus = Database["public"]["Enums"]["order_status"];
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    toast.success("Status ažuriran!");
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    ready: "bg-green-100 text-green-800",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    pending: "Na čekanju",
    confirmed: "Potvrđena",
    preparing: "Priprema se",
    ready: "Spremna",
    completed: "Završena",
    cancelled: "Otkazana",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <QrCode className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">Dashboard</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="mr-1 h-4 w-4" /> Odjavi se
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 md:px-8">
          {([
            { key: "orders" as Tab, icon: ShoppingCart, label: "Porudžbine" },
            { key: "menu" as Tab, icon: UtensilsCrossed, label: "Meni" },
            { key: "tables" as Tab, icon: Table, label: "Stolovi" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-foreground">Porudžbine</h2>
            {orders.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-muted-foreground">Još nema porudžbina</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-semibold text-foreground">
                        Sto {order.table_number ?? "?"}
                      </span>
                      <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">€{Number(order.total).toFixed(2)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.payment_method === "card" ? "Kartica" : "Gotovina"} • {new Date(order.created_at).toLocaleTimeString("sr")}
                    </p>
                    {order.customer_note && (
                      <p className="mt-2 text-sm italic text-muted-foreground">"{order.customer_note}"</p>
                    )}
                    {order.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="hero" onClick={() => updateOrderStatus(order.id, "confirmed")}>
                          Potvrdi
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "cancelled")}>
                          Otkaži
                        </Button>
                      </div>
                    )}
                    {order.status === "confirmed" && (
                      <Button size="sm" variant="hero" className="mt-3" onClick={() => updateOrderStatus(order.id, "preparing")}>
                        Priprema se
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button size="sm" variant="hero" className="mt-3" onClick={() => updateOrderStatus(order.id, "ready")}>
                        Spremna
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button size="sm" variant="secondary" className="mt-3" onClick={() => updateOrderStatus(order.id, "completed")}>
                        Završi
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "menu" && (
          <div className="space-y-8">
            {/* Categories */}
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">Kategorije</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span key={c.id} className="rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
                    {c.name}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Nova kategorija..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                />
                <Button size="sm" variant="hero" onClick={addCategory}>
                  <Plus className="mr-1 h-4 w-4" /> Dodaj
                </Button>
              </div>
            </div>

            {/* Products */}
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">Proizvodi</h2>
              {products.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
                      <div>
                        <p className="font-semibold text-foreground">{p.name}</p>
                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      </div>
                      <span className="font-heading text-lg font-bold text-primary">€{Number(p.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
                <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" placeholder="Naziv proizvoda" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" placeholder="Opis" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" placeholder="Cena (€)" type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                <div className="flex gap-2">
                  <select className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" value={newProduct.category_id} onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}>
                    <option value="">Kategorija</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <Button size="sm" variant="hero" onClick={addProduct}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tables" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-foreground">Stolovi i QR kodovi</h2>
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <p className="text-foreground">
                Trenutno imate <span className="font-bold text-primary">{tableCount}</span> stolova.
              </p>
              <div className="mt-4 flex gap-2">
                <input
                  className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
                  type="number"
                  min="1"
                  placeholder="Broj stolova"
                  value={newTableCount}
                  onChange={(e) => setNewTableCount(e.target.value)}
                />
                <Button variant="hero" size="sm" onClick={generateTables}>
                  <Plus className="mr-1 h-4 w-4" /> Generiši stolove
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Svaki sto automatski dobija jedinstven QR kod koji vodi do vašeg menija.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
