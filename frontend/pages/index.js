import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FilterMenu from '../components/FilterMenu'
import Listings from '../components/Listing/Listings'
import { useMemo, useState,useEffect } from 'react'
import listingsData from '../data/listings'
import AddListingModal from '../components/Listing/AddListingModal'
import EditListingModal from '../components/Listing/EditListingModal'
import ReserveListingModal from '../components/Listing/ReserveListingModal'
import { format } from 'date-fns'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAirbnb } from '../hooks/useAirbnb'


export default function Home() {

    const {connected, publicKey} = useWallet()
    const {
        initialized, 
        initializeUser, 
        airbnbs, 
        addAirbnb,
        updateAirbnb,
        removeAirbnb,
        bookAirbnb,
        bookings,
        cancelBooking,
    } = useAirbnb()

    const [showReservedListing, setShowReservedListing] = useState(false)
    const [listings, setListings] = useState(listingsData)
    const [addListingModalOpen, setAddListingModalOpen] = useState(false)
    const [editListingModalOpen, setEditListingModalOpen] = useState(false)
    const [reserveListingModalOpen, setReserveListingModalOpen] = useState(false)
    const [currentEditListingID, setCurrentEditListingID] = useState(null)
    const [currentReserveListingID, setCurrentReserveListingID] = useState(null)
    const currentEditListing = useMemo(() => airbnbs.find((airbnb) => airbnb.account.idx === currentEditListingID), [currentEditListingID])
    const displayListings = useMemo(() => (showReservedListing ? bookings : airbnbs), [showReservedListing, airbnbs])
    
    const toggleShowReservedListing = () => {
        setShowReservedListing(!showReservedListing)
    }


    const toggleEditListingModal = (value, listingID) => {
        setCurrentEditListingID(listingID)

        setEditListingModalOpen(value)
    }

    const toggleReserveListingModal = (value, listingID) => {
        setCurrentEditListingID(listingID)

        setReserveListingModalOpen(value)
    }

    const reserveListing = ({ startDate, endDate }) => {

        // setListings(
        //     listings.map((listing) => {
        //         if (listing.id === currentReserveListingID) return { ...listing, isReserved: true, reservation: range }
        //         return listing
        //     })
        // )
    }

    const unreserveListing = () => {
        setListings(
            listings.map((listing) => {
                if (listing.id === currentReserveListingID) return { ...listing, isReserved: false, reservation: null }

                return listing
            })
        )
    }

    return (
        <div>
            <Head>
                <title>Airbnb Clone</title>
            </Head>
            <Header connected={connected} publicKey = {publicKey} initialized = {initialized} initializeUser = {initializeUser}/>
            <main className="pt-10 pb-20">
                <FilterMenu />
                {connected && (
                    <div className="px-20 pb-10 flex justify-end space-x-4">
                        <button onClick={toggleShowReservedListing} className="border rounded-lg p-4 text-xs font-medium">
                            {showReservedListing ? 'Reserved' : 'All'}
                        </button>
                        <button onClick={() => setAddListingModalOpen(true)} className="border rounded-lg p-4 text-xs font-medium">
                            Add Listing
                        </button>
                    </div>
                )}

                <Listings connected={connected} showReservedListing={showReservedListing} listings={displayListings} toggleEditListingModal={toggleEditListingModal} toggleReserveListingModal={toggleReserveListingModal} removeListing={removeAirbnb} unreserveListing={cancelBooking} />

                <AddListingModal addListing={addAirbnb} addListingModalOpen={addListingModalOpen} setAddListingModalOpen={setAddListingModalOpen} />
                <EditListingModal editListing={updateAirbnb} currentEditListing={currentEditListing} editListingModalOpen={editListingModalOpen} setEditListingModalOpen={setEditListingModalOpen} />
                <ReserveListingModal reserveListing={bookAirbnb} currentEditListing={currentEditListing} reserveListingModalOpen={reserveListingModalOpen} setReserveListingModalOpen={setReserveListingModalOpen} />
            </main>
            <Footer />
        </div>
    )
}