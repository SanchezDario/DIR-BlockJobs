import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { utils } from "near-api-js";
import { toast } from "react-toastify";

import { buyService, getServiceById, getUser, login } from "../utils";
import CreateServiceDialog from "../components/CreateServiceDialog";
import ServicesCard from "../components/ServicesCard";
import UserProfile from "../components/UserProfile";

import { useGlobalState } from "../state";

export default function Service() {
    const [isUserCreated] = useGlobalState('isUserCreated');
    let [service, setService] = useState();
    let [user, setUser] = useState();
    let [loading, setLoading] = useState(true)
    let [isOpen, setIsOpen] = useState(false)
    let [timeLeft, setTimeLeft] = useState(new Date())
    const params = useParams();
    // const [] = useAsync(async () => {

    // })
    
    useEffect(async ()=>{
        let loadingService = true
        let loadingUser = true
        let s = await getServiceById(Number(params.id))
        console.log(s)
        if (s) {
            setService(s)
            loadingService = false
        }

        let user = await getUser(s.creator_id)
        if (user) {
            user.personal_data = JSON.parse(user.personal_data)
            console.log(user)
            setUser(user)
            loadingUser = false
        }
        if (!loadingService && !loadingUser) {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        let timerId = setTimeout(() => {
            setTimeLeft(new Date())
        }, 1000)
        return function cleanup() {
            clearInterval(timerId);
        }
    }, [timeLeft])
    
    const handleBuyService = async () => {
        const userBalance = utils.format.formatNearAmount((await window.walletConnection.account().getAccountBalance()).available)
        
        if (service.metadata.price < userBalance) {
            const amount = utils.format.parseNearAmount(String(service.metadata.price))
            console.log(amount)
            await buyService(service.id, amount)
            return
        }
        
        toast.error("No tienes suficientes fondos para adquirir este servicio")
    }

    function closeModal() {
        setIsOpen(false)
    }
    
    function openModal() {
        setIsOpen(true)
    }
    
    function dateToString(date) {
        let d = new Date(Math.round(date / 1000000)).toLocaleDateString()
        return d
    }
    
    function timeLeftService(sold_moment) {
        let s = new Date(Math.round((sold_moment * service.duration) / 1000000)) - timeLeft
        let diff = new Date(s)
        return `${diff.getHours()}:${diff.getMinutes()}:${diff.getSeconds()}`
    }

    return (
        <div className="">
            { service && <CreateServiceDialog isOpen={isOpen} closeModal={closeModal} openModal={openModal} service={service}/>}
            <div className="m-8">
                {
                    loading ? (
                        <div className="h-screen">
                            <svg className="spinner" viewBox="0 0 50 50">
                                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                            </svg>
                        </div>
                    ) : (
                        <div>
                            {
                                !window.walletConnection.isSignedIn() ? (
                                    <button onClick={login} className="uppercase py-2 px-4 rounded-lg bg-[#04AADD] border-transparent text-white text-md mr-4">Login</button>
                                ) : (((service.actual_owner != window.accountId) || (service.creator_id != window.accountId)) && (!service.sold)) && isUserCreated ? (
                                    <button onClick={handleBuyService} className="uppercase py-2 px-4 rounded-lg bg-green-500 border-transparent text-white text-md mr-4">Comprar servicio</button>
                                ) : ((service.actual_owner == window.accountId) && (service.creator_id == window.accountId) && isUserCreated) ? (
                                    <div className="flex flex-row justify-between">
                                        <div className="flex">
                                            <button onClick={openModal} className="uppercase py-2 px-4 rounded-lg bg-[#04AADD] border-transparent text-white text-md mr-4">Editar servicio</button>
                                            <button className="uppercase py-2 px-4 rounded-lg bg-red-400 border-transparent text-white text-md mr-4">Eliminar servicio</button>
                                        </div>
                                    </div>
                                ): ((service.actual_owner == window.accountId) && (service.creator_id != window.accountId) && isUserCreated) ? (
                                    <span className="uppercase py-2 px-4 rounded-lg bg-green-500 border-transparent text-white text-md mr-4">Usted ya adquirio este servicio!</span>
                                ) : (
                                    <></>
                                )
                                // <button className="uppercase py-2 px-4 rounded-lg bg-green-600 border-transparent text-white text-md mr-4">
                                    /* Reclamar Pago! */
                                /* </button> */
                            }
                            <div className="border-2 rounded-lg px-6 py-4 mt-4">
                                <div className="text-2xl font-bold text-gray-800 mb-4">Servicio</div>
                                <ServicesCard service={service}/>
                                <div className="text font-bold text-gray-800 mb-4">Momento de compra {dateToString(service.buy_moment)}</div>
                                <div className="text font-bold text-gray-800 mb-4">Terminara en {timeLeftService(service.buy_moment)}</div>
                            </div>
                            <div className="border-2 rounded-lg px-6 py-4 mt-4">
                                <div className="text-2xl font-bold text-gray-800 mb-4">Perfil del usuario</div>
                                <UserProfile user={user} />
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    )
}