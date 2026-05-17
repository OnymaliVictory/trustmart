import { Toaster } from "react-hot-toast";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-abyss">
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0e0e1f",
            color: "#f1f5f9",
            border: "1px solid #1a1a38",
            borderRadius: "12px",
            fontSize: "14px",
            fontFamily: "'DM Sans', sans-serif",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#0e0e1f" },
            duration: 4000,
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#0e0e1f" },
            duration: 6000,
          },
          loading: {
            iconTheme: { primary: "#6d28d9", secondary: "#0e0e1f" },
          },
        }}
      />
    </div>
  );
}
