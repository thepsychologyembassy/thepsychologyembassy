"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { client } from "../../../lib/sanity";
import Navbar from "../../../components/Navbar";

export default function ProgramPaymentPage() {
  const { id } = useParams();
  const [application, setApplication] = useState<any>(null);
  const [programPrice, setProgramPrice] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      const { data: appData, error: appError } = await supabase
        .from("program_applications")
        .select("*")
        .eq("id", id)
        .single();

      if (appError || !appData) {
        setIsLoading(false);
        return;
      }
      setApplication(appData);

      const programData = await client.fetch(
        `*[_id == $programId][0]{ price }`, 
        { programId: appData.program_id }
      );
      
      if (programData) {
        setProgramPrice(programData.price);
      }
      setIsLoading(false);
    };

    if (id) fetchPaymentDetails();
  }, [id]);

  const handlePayment = async () => {
    if (!application || programPrice === null) return;
    setIsProcessing(true);
    setStatusMessage("Initializing Secure PayU Checkout...");

    try {
      // 1. Fetch Secure Hash for the Program
      const res = await fetch("/api/payu/hash-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          applicationId: application.id,
          firstname: application.applicant_name,
          email: application.applicant_email,
          phone: application.applicant_phone || "9999999999",
          productinfo: `Enrollment: ${application.program_title}`
        }),
      });
      
      const { hash, txnid, key, amount, error } = await res.json();
      
      if (error || !hash) throw new Error(error || "No Hash Generated");

      // 2. Build Dynamic Form & Submit to PayU
      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", "https://secure.payu.in/_payment");

      const appendInput = (name: string, value: any) => {
        const input = document.createElement("input");
        input.setAttribute("type", "hidden");
        input.setAttribute("name", name);
        input.setAttribute("value", value);
        form.appendChild(input);
      };

      appendInput("key", key);
      appendInput("txnid", txnid);
      appendInput("amount", amount);
      appendInput("productinfo", `Enrollment: ${application.program_title}`);
      appendInput("firstname", application.applicant_name);
      appendInput("email", application.applicant_email);
      appendInput("phone", application.applicant_phone || "9999999999"); 
      
      // Attach the application ID securely as UDF1 for your Webhooks
      appendInput("udf1", application.id); 

      // Redirects (Ensure these point to a route that handles program confirmations!)
      appendInput("surl", `${window.location.origin}/api/payu/response-program`);
      appendInput("furl", `${window.location.origin}/api/payu/response-program`);
      appendInput("hash", hash);

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error(err);
      setStatusMessage("Checkout error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FBF8F2]"><p className="animate-pulse tracking-widest text-[#88B7B5] uppercase text-sm">Verifying Application...</p></div>;
  }

  if (!application) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FBF8F2]"><h1 className="font-serif text-3xl text-[#2C4C5B]">Application Not Found</h1></div>;
  }

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />
      <section className="mx-auto max-w-2xl px-6 pb-24 pt-40">
        <div className="overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white shadow-xl">
          <div className="border-b border-[#3A3A38]/10 bg-[#88B7B5]/10 px-8 py-8 text-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#88B7B5]">Secure Enrollment</p>
            <h1 className="font-serif text-3xl font-medium text-[#2C4C5B] leading-tight">{application.program_title}</h1>
          </div>
          <div className="p-8 sm:p-12">
            <div className="mb-8 rounded-2xl bg-[#FBF8F2] p-6 text-sm border border-[#3A3A38]/5">
              <p className="mb-2"><strong className="text-[#3A3A38]">Applicant:</strong> {application.applicant_name}</p>
              <p className="mb-2"><strong className="text-[#3A3A38]">Email:</strong> {application.applicant_email}</p>
              <p><strong className="text-[#3A3A38]">Program Fee:</strong> ₹{programPrice?.toLocaleString() || "Error loading price"}</p>
            </div>

            {application.status === 'pending' && <div className="text-center text-[#3A3A38]/60">Your application is still under review. You cannot pay yet.</div>}
            {application.status === 'expired' && <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600"><h3 className="font-serif text-2xl mb-2">Window Expired</h3><p className="text-sm">Your 24-hour payment window has closed and this link is no longer active.</p></div>}
            {application.status === 'paid' && <div className="rounded-2xl border border-[#4F6F52]/20 bg-[#4F6F52]/5 p-6 text-center text-[#4F6F52]"><h3 className="font-serif text-2xl mb-2">Payment Complete</h3><p className="text-sm font-medium">Your seat is officially secured. We will be in touch with next steps!</p></div>}
            
            {application.status === 'accepted' && programPrice !== null && (
              <div className="flex flex-col gap-6">
                <button onClick={handlePayment} disabled={isProcessing} className="w-full rounded-full bg-[#2C4C5B] py-4 text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50">
                  {isProcessing ? "Processing..." : `Pay ₹${programPrice.toLocaleString()} via PayU`}
                </button>
                {statusMessage && <p className={`text-center text-sm font-medium ${statusMessage.includes("Success") || statusMessage.includes("Secured") ? "text-[#4F6F52]" : "text-red-500"}`}>{statusMessage}</p>}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}