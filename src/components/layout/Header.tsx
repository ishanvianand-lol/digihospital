import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
  Activity,
  LogOut,
  User,
  Menu,
  X,
  AlertTriangle,
  Home,
  Info,
} from "lucide-react";
import { useState } from "react";

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/emergency", label: "Emergency", icon: AlertTriangle },
    { href: "/about", label: "About", icon: Info },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      width: "100%",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      background: "rgba(6,12,18,0.85)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)"
    }}>
      <style>{`
        .hdr-btn {
          transition: all .2s ease !important;
        }
        .hdr-btn:hover {
          transform: translateY(-1px) !important;
          filter: brightness(1.15) !important;
        }
        .hdr-link {
          position: relative;
          transition: all .2s ease;
        }
        .hdr-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 80%;
          height: 2px;
          background: linear-gradient(90deg, #38bdf8, #34d399);
          border-radius: 2px;
          transition: transform .2s ease;
        }
        .hdr-link.active::after {
          transform: translateX(-50%) scaleX(1);
        }
        .hdr-link.active {
          background: rgba(56,189,248,0.12) !important;
          color: #38bdf8 !important;
        }
        .mobile-menu {
          animation: slideDown .3s ease both;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0 16px",
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "none"
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "linear-gradient(135deg, #38bdf8, #0284c7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(56,189,248,0.3)"
          }}>
            <Activity size={22} style={{ color: "#fff" }} />
          </div>
          <span style={{
            fontSize: 19,
            fontWeight: 800,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: "-0.02em"
          }} className="hidden sm:inline-block">
            Digital Hospital
          </span>
        </Link>

        {/* Desktop Navigation */}
        {user && (
          <nav style={{
            display: "flex",
            alignItems: "center",
            gap: 6
          }} className="hidden md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} style={{ textDecoration: "none" }}>
                <button
                  className={`hdr-btn hdr-link ${isActive(link.href) ? 'active' : ''}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: isActive(link.href) 
                      ? "rgba(56,189,248,0.12)" 
                      : "transparent",
                    color: isActive(link.href) 
                      ? "#38bdf8" 
                      : "rgba(255,255,255,0.6)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {link.icon && <link.icon size={16} />}
                  {link.label}
                </button>
              </Link>
            ))}
          </nav>
        )}

        {/* Right Side */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hdr-btn"
                    style={{
                      position: "relative",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    <Avatar style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: "2px solid rgba(56,189,248,0.3)"
                    }}>
                      <AvatarFallback style={{
                        background: "linear-gradient(135deg, #38bdf8, #0284c7)",
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: 700
                      }}>
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end"
                  style={{
                    width: "240px",
                    background: "rgba(10,18,24,0.98)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 14,
                    padding: "8px",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.6)"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    marginBottom: 4
                  }}>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      flex: 1,
                      minWidth: 0
                    }}>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.88)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {user.email}
                      </p>
                      <p style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)"
                      }}>
                        Logged in
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator style={{
                    margin: "6px 0",
                    background: "rgba(255,255,255,0.06)"
                  }} />
                  <DropdownMenuItem asChild>
                    <Link 
                      to="/dashboard" 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 14,
                        color: "rgba(255,255,255,0.75)",
                        fontWeight: 500,
                        textDecoration: "none"
                      }}
                    >
                      <User size={16} />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{
                    margin: "6px 0",
                    background: "rgba(255,255,255,0.06)"
                  }} />
                  <DropdownMenuItem
                    onClick={signOut}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 14,
                      color: "#f87171",
                      fontWeight: 600
                    }}
                  >
                    <LogOut size={16} />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <button
                className="hdr-btn md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.7)"
                }}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link to="/auth" style={{ textDecoration: "none" }}>
                <button
                  className="hdr-btn"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "9px 18px",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.75)",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Log in
                </button>
              </Link>
              <Link to="/auth?mode=signup" style={{ textDecoration: "none" }}>
                <button
                  className="hdr-btn"
                  style={{
                    background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                    border: "none",
                    borderRadius: 10,
                    padding: "9px 20px",
                    fontSize: 14,
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(14,165,233,0.3)"
                  }}
                >
                  Get Started
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && mobileMenuOpen && (
        <div 
          className="mobile-menu md:hidden"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(6,12,18,0.95)",
            padding: "16px"
          }}
        >
          <nav style={{
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{ textDecoration: "none" }}
              >
                <button
                  className={`hdr-btn ${isActive(link.href) ? 'active' : ''}`}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 10,
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: isActive(link.href)
                      ? "rgba(56,189,248,0.12)"
                      : "rgba(255,255,255,0.03)",
                    color: isActive(link.href)
                      ? "#38bdf8"
                      : "rgba(255,255,255,0.7)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {link.icon && <link.icon size={18} />}
                  {link.label}
                </button>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}