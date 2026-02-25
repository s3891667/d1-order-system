import Image from 'next/image'

/**
 * Footer component - Displays the footer section with logo and navigation links.
 */

export default function Footer() {
	return (
		<div>
			{/* footer wrapper */}
			<footer className=" bg-white">
				<div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">

					{/*flex container to align logo and navigation links side by side*/}
					<div className="flex items-center justify-between">
						<a href="/" className="flex items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse">
							<Image src="/d1storelogo.jpg"
								width={100} height={200} className="h-8" alt="RMIT Logo" />
							<span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Flowbite</span>
						</a>

						{/* Navigation links in the footer */}
						<ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-400">
							<li>
								<a className="lg:hover:text-blue-700 me-4 md:me-6">
									About
								</a>
							</li>
							<li>
								<a className="lg:hover:text-blue-700 me-4 md:me-6">
									Privacy
								</a>
							</li>
							<li>
								<a className="lg:hover:text-blue-700 me-4 md:me-6">
									Licensing
								</a>
							</li>
							<li>
								<a className="lg:hover:text-blue-700 me-4 md:me-6">
									Contact
								</a>
							</li>
							<p className=" lg:hover:text-blue-700 text-sm">© 2026 D1 Store. All rights reserved.</p>
						</ul>

					</div>
				</div>
			</footer>
		</div>
	);

}

