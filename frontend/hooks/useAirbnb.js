import * as anchor from '@project-serum/anchor'
import { useEffect, useMemo, useState } from 'react'
import { AIRBNB_PROGRAM_PUBKEY } from '../constants'
import airbnbIDL from '../constants/airbnb.json'
import { SystemProgram } from '@solana/web3.js'
import {utf8} from '@project-serum/anchor/dist/cjs/utils/bytes'
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey'
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { authorFilter } from '../utils'
import { PublicKey } from '@solana/web3.js'
import { set } from 'date-fns'
import { tr } from 'date-fns/locale'

export const useAirbnb = () => {

    const { connection } = useConnection()
    const { publicKey } = useWallet()
    const anchorWallet = useAnchorWallet()

    const [initialized, setInitialized] = useState(false)
    const [transactionPending, setTransactionPending] = useState(false)
    const [airbnbs, setAirbnbs] = useState([])
    const [user, setUser] = useState({})
    const [lastAirbnb, setLastAirbnb] = useState(0)
    const [lastBookId, setLastBookId] = useState(0)
    const [bookings, setBookings] = useState([])

    const program = useMemo(()=> {
        if(anchorWallet) {
            const provider = new anchor.AnchorProvider(connection, anchorWallet, anchor.AnchorProvider.defaultOptions())

            return new anchor.Program(airbnbIDL, AIRBNB_PROGRAM_PUBKEY, provider)
        }
    }, [connection, anchorWallet])

    // When we load app we want to get ALL of the accounts
    // First check if there is a userProfile account exists
    // IF exists load all AIRBNB ACCOUNTS
    // DOES NOT exist, intializeUser

    useEffect(()=> {
        const start = async () => {
            if(program && publicKey && !transactionPending) {
                try {
                    const [profilePda] = await findProgramAddressSync([utf8.encode("USER_STATE"), publicKey.toBuffer()], program.programId)
                    const profileAccount = await program.account.userProfile.fetch(profilePda)

                    if(profileAccount) {
                        setInitialized(true)
                      setLastAirbnb(profileAccount.lastAirbnb)
                        const listings = await program.account.airbnbAccount.all()
                        const allbookings = await program.account.bookingAccount.all()

                        const myBookings = allbookings.filter(booking => booking.account.authority.toString() == profileAccount.authority.toString())

                        setUser(profileAccount.toString())
                        setAirbnbs(listings)
                        setBookings(myBookings)
                    } else {
                        setInitialized(false)
                    }
                } catch(error) {
                    console.log(error)
                }
            }
        }

        start()
    }, [publicKey, program, transactionPending])

    const initializeUser = async () => {
        if(program && publicKey) {
            try {
                setTransactionPending(true)
                const [profilePda] = findProgramAddressSync([utf8.encode('USER_STATE'), publicKey.toBuffer()], program.programId)

                const tx = await program.methods
                .intializeUser()
                .accounts({
                    userProfile: profilePda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()
                setInitialized(true)
            } catch (err) {
                console.log(err)
            } finally {
                setTransactionPending(false)
            }
        }
    }

    const addAirbnb = async ({location,country,price,imageURL}) => {
        if(program && publicKey) {
            setTransactionPending(true)
            try {
                const [profilePda] = findProgramAddressSync([utf8.encode('USER_STATE'), publicKey.toBuffer()], program.programId)
                const [airbnbPda] = findProgramAddressSync([utf8.encode('AIRBNB_STATE'), publicKey.toBuffer(), Uint8Array.from([lastAirbnb])], program.programId)

                await program.methods
                    .addAirbnb(location, country, price, imageURL)
                    .accounts({
                        userProfile: profilePda,
                        airbnbAccount: airbnbPda,
                        authority: publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc()
            } catch(err){
                console.log(err)
            } finally {
                setTransactionPending(false)
            }
        }
    }  

    const updateAirbnb = async({airbnbPda, airbnbIdx, location,country,price,imageURL}) => {
        if(program && publicKey) {
            setTransactionPending(true)
            try {
                // const [airbnbPda] = findProgramAddressSync([utf8.encode('AIRBNB_STATE'), publicKey.toBuffer(), Uint8Array.from([lastAirbnb])], program.programId)
                await program.methods
                .updateAirbnb(airbnbIdx, location, country,price,imageURL)
                .accounts({
                    airbnbAccount: airbnbPda,
                    authority:publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()
            } catch(err) {
                console.log(err)
            } finally {
                setTransactionPending(false)
            }
        }

    }

    const removeAirbnb = async (airbnbPda ,airbnbIdx) => {
        if(program && publicKey) {
            try {
                setTransactionPending(true)

                const [profilePda] = findProgramAddressSync([utf8.encode('USER_STATE'), publicKey.toBuffer()], program.programId)

                await program.methods
                .removeAirbnb(airbnbIdx)
                .accounts({
                    userProfile: profilePda,
                    airbnbAccount: airbnbPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()
            } catch(err) {
                console.log(err)
            } finally {
                setTransactionPending(false)
            }
        }
    }

    const bookAirbnb = async ({location,country,price,image},date) => {
        console.log(location,country,price,image,date,"BOOKING")

        const id = lastBookId + 1
        if(program && publicKey) {
            try {
                setTransactionPending(true)
                const [profilePda] = findProgramAddressSync([utf8.encode('USER_STATE'), publicKey.toBuffer()], program.programId)
                const [bookPda] = findProgramAddressSync([utf8.encode('BOOK_STATE'), publicKey.toBuffer()], program.programId)

                await program.methods
                .bookAirbnb(id, date,location,country,price,image)
                .accounts({
                    userProfile: profilePda,
                    bookingAccount: bookPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()
            } catch(err) {
                console.log(err)
            } finally {
                setTransactionPending(false)
            }
        }
    }

    const cancelBooking = async (bookingPda, idx) => {
        if(program && publicKey) {
            try {
                setTransactionPending(true)

                await program.methods
                .cancelBooking(idx)
                .accounts({
                    bookingAccount: bookingPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()
            } catch(err) {
                console.log(err)
            } finally {
                setTransactionPending(false)
            }
        }
    }



       
    return {initialized, initializeUser, airbnbs, addAirbnb, updateAirbnb,removeAirbnb, bookAirbnb, bookings, cancelBooking}
}

































// const updateAirbnb = async ({airbnbPda, airbnbIdx,location, country, price, imageURL}) => {
//     console.log(airbnbPda.toString())
//     if (program && publicKey) {
//         setTransactionPending(true)
//         try {
//             await program.methods
//                 .updateAirbnb(airbnbIdx,location, country, price, imageURL)
//                 .accounts({
//                     airbnbAccount: airbnbPda,
//                     authority: publicKey,
//                     systemProgram: SystemProgram.programId,
//                 })
//                 .rpc()
//         } catch (error) {
//             console.error(error)
//         } finally {
//             setTransactionPending(false)
//         }
//     }
// }