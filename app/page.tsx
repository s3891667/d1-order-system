import Image from "next/image";

export default function Home() {
  return (
		<div className="min-h-screen flex flex-col bg-[#CAF0F8] text-[#03045E]">

			{/* Hero Section */}
			<section
				className="flex items-center justify-center text-center p-10 bg-cover bg-center bg-no-repeat min-h-screen"
				style={{ backgroundImage: "url('/orderImage.jpg')" }}
			>
				<div className="bg-white/90 p-8 rounded-xl shadow max-w-2xl text-[#03045E]">
					<h1 className="text-5xl font-extrabold tracking-tight mb-4">
                    Let's manage your orders with ease
					</h1>
					<p className="text-lg mb-6">
                            D1 store dedicated platform for manager and dispatch team
					</p>
					<a href="/explore">
						<button className="mt-2 px-6 py-2 bg-[#0077B6] text-white rounded hover:bg-[#00B4D8] transition">
							Explore
						</button>
					</a>
				</div>
			</section>
		</div>

  );
}
