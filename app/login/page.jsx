"use client";

import React from "react";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Plasma from '@/components/ui/Plasma';
import Imglogo from "../assets/logo.png"
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth.store";

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await login(email, password);
      console.log('Login result:', res);

      if (res.success) {
        // Cek token tersimpan gak
        console.log('Token di localStorage:', localStorage.getItem('jwt_token'));
        console.log('Auth state:', useAuthStore.getState());

        // Tunggu sebentar sebelum redirect
        await new Promise(r => setTimeout(r, 500));

        console.log('Auth state setelah delay:', useAuthStore.getState());
        router.push("/dashboard");
      } else {
        setErrorMessage("Email atau password salah");
      }
    } catch (error) {
      setErrorMessage("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden min-h-screen bg-linear-to-r from-gray-500 to-gray-50 items-center justify-center">
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div style={{ width: '100%', height: '600px', position: 'relative' }} className="opacity-25">
            <Plasma
              color="#ffffff"
              speed={0.8}
              direction="forward"
              scale={1.1}
              opacity={0.8}
              mouseInteractive={true}
            />
          </div>
        </div>

        <div className="flex flex-col justify-center items-center mt-10 pt-10">
          <div className="text-4xl mb-5">
            <Image
              src={Imglogo}
              alt="Logo"
              width={200} />
          </div>
          <h1 className="font-bold mb-5 sm:text-xl md:text-2xl text-gray-700">WELCOME TO MPS <span className="text-red-500">NEWTON</span> </h1>
          <Card className="w-full max-w-sm h-100 flex  flex-col justify-center bg-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-center mb-3 font-bold text-lg text-gray-600">Login to your account</CardTitle>
              <CardDescription className="text-center text-gray-700">
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border border-gray-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-gray-700"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input id="password" type="password" required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border border-gray-400"
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button disabled={loading} onClick={handleLogin} type="submit" className="w-full cursor-pointer">
                {loading ? "loading..." : "Masuk"}
              </Button>
            </CardFooter>
          </Card>

        </div>
      </div>
    </>
  );
}
