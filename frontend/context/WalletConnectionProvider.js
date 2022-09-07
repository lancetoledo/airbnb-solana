import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useMemo } from "react";
const connection = "https://attentive-orbital-bush.solana-devnet.discover.quiknode.pro/96c0ba57558fd49748439d489f8862cdcc4469a6/"

const WalletConnectionProvider = ({children}) => {
    const endpoint = useMemo(()=> connection, [])

    const wallets = useMemo(()=> [new PhantomWalletAdapter()], [])

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default WalletConnectionProvider