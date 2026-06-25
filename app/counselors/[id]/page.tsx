import { client, urlFor } from "../../../lib/sanity";
import Navbar from "../../../components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// Next.js requires this for dynamic routes in the App Router
export default async function CounselorProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Fetch the specific counselor using their Sanity _id
  const counselor = await client.fetch(
    `*[_type == "counselor" && _id == $id][0]`,
    { id }
  );

  // If someone types a random ID in the URL, show a 404 page instead of crashing
  if (!counselor) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        <div className="flex flex-col gap-12 md:flex-row">
          
          {/* LEFT COLUMN: Image & Quick Stats */}
          <div className="w-full md:w-1/3">
            <div className="sticky top-32 flex flex-col items-center rounded-3xl border border-[#3A3A38]/10 bg-white p-8 shadow-sm">
              <div className="relative mb-6 h-48 w-48 overflow-hidden rounded-full border-4 border-[#88B7B5]/20 bg-[#FBF8F2]">
                {counselor.image ? (
                  <Image src={urlFor(counselor.image).url()} alt={counselor.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#88B7B5]/10 text-4xl text-[#2C4C5B]">
                    {counselor.name.charAt(0)}
                  </div>
                )}
              </div>
              
              <h1 className="font-serif text-2xl font-medium text-[#2C4C5B] text-center mb-1">{counselor.name}</h1>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#4F6F52] text-center mb-6">{counselor.designation}</p>

              <div className="w-full space-y-4 border-t border-[#3A3A38]/10 pt-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#3A3A38]/50">Session Fee</p>
                  <p className="font-medium text-[#3A3A38]">₹{counselor.fees} / hour</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#3A3A38]/50">Consultation Mode</p>
                  <p className="font-medium capitalize text-[#3A3A38]">{counselor.mode.replace('-', ' ')}</p>
                </div>
                {counselor.experience && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#3A3A38]/50">Experience</p>
                    <p className="font-medium text-[#3A3A38]">{counselor.experience}</p>
                  </div>
                )}
              </div>

              <Link href={`/book`} className="mt-8 w-full rounded-full bg-[#2C4C5B] py-3 text-center text-sm font-medium tracking-wide text-white transition-transform hover:-translate-y-1 hover:shadow-lg">
                Book a Session
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Bio & Details */}
          <div className="w-full md:w-2/3">
            <div className="rounded-3xl border border-[#3A3A38]/10 bg-white p-8 shadow-sm sm:p-12">
              <h2 className="font-serif text-3xl font-medium text-[#2C4C5B] mb-6">About {counselor.name.split(' ')[0]}</h2>
              
              <div className="prose prose-sm max-w-none text-[#3A3A38]/80 leading-relaxed mb-10 whitespace-pre-wrap">
                {counselor.bio || "No biography available at this time."}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-[#3A3A38]/10 pt-8">
                {counselor.education && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#4F6F52]">Education & Credentials</h3>
                    <p className="text-sm text-[#3A3A38]/80">{counselor.education}</p>
                  </div>
                )}

                {counselor.languages && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#4F6F52]">Languages Spoken</h3>
                    <p className="text-sm text-[#3A3A38]/80">{counselor.languages}</p>
                  </div>
                )}

                {counselor.mode !== 'online' && counselor.clinicAddress && (
                  <div className="sm:col-span-2">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#4F6F52]">Clinic Location</h3>
                    <p className="text-sm text-[#3A3A38]/80">{counselor.clinicAddress}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}