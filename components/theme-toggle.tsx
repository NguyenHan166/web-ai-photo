"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const root = document.documentElement;
        if (root.classList.contains("dark")) {
            setTheme("dark");
        }
    }, []);

    const toggleTheme = () => {
        const root = document.documentElement;
        if (theme === "light") {
            root.classList.add("dark");
            setTheme("dark");
            localStorage.setItem("theme", "dark");
        } else {
            root.classList.remove("dark");
            setTheme("light");
            localStorage.setItem("theme", "light");
        }
    };

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                disabled
                className="rounded-full"
            />
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative rounded-full hover:bg-primary/10 transition-all hover:scale-110 active:scale-95"
            aria-label={`Switch to ${
                theme === "light" ? "dark" : "light"
            } mode`}
        >
            <div className="relative w-5 h-5">
                <Sun
                    className={`absolute inset-0 w-5 h-5 transition-all duration-500 ${
                        theme === "light"
                            ? "rotate-0 scale-100 opacity-100"
                            : "rotate-90 scale-0 opacity-0"
                    }`}
                />
                <Moon
                    className={`absolute inset-0 w-5 h-5 transition-all duration-500 ${
                        theme === "dark"
                            ? "rotate-0 scale-100 opacity-100"
                            : "-rotate-90 scale-0 opacity-0"
                    }`}
                />
            </div>
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
