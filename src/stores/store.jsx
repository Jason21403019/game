import { createContext, useState } from 'react'

const StoreContext = createContext();

function StoreProvider({ children }) {
    const [identity, setIdentity] = useState('');
    const [email, setEmail] = useState('');
    const [udnmember, setUdnmember] = useState('');
    const [um2, setUm2] = useState('');
    const [login, setLogin] = useState(false);
    const [loginBlock, setLoginBlock] = useState(true);
    const [cardsBlock, setCardsBlock] = useState(false);
    const [resultBlock, setResultBlock] = useState(false);
    const [signSuccess, setSignSuccess] = useState(false);
    const [loadingBlock, setLoadingBlock] = useState(true);
    const [hasStarted, setHasStarted] = useState(false);
    const [eventStatus, setEventStatus] = useState(true);
    const [signCount, setSignCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [screenWidth, setScreenWidth] = useState(0);
    const [result, setResult] = useState('');
    const [great, setGreat] = useState(0);
    const [csrfToken, setCsrfToken] = useState('');

    const store = {
        identityState: [identity, setIdentity],
        emailState: [email, setEmail],
        udnmemberState: [udnmember, setUdnmember],
        um2State: [um2, setUm2],
        loginState: [login, setLogin],
        loginBlockState: [loginBlock, setLoginBlock],
        cardsBlockState: [cardsBlock, setCardsBlock],
        resultBlockState: [resultBlock, setResultBlock],
        signSuccessState: [signSuccess, setSignSuccess],
        loadingBlockState: [loadingBlock, setLoadingBlock],
        hasStartedState: [hasStarted, setHasStarted],
        eventStatusState: [eventStatus, setEventStatus],
        signCountState: [signCount, setSignCount],
        openState: [open, setOpen],
        screenWidthState: [screenWidth, setScreenWidth],
        resultState: [result, setResult],
        greatState: [great, setGreat],
        csrfTokenState: [csrfToken, setCsrfToken],
    };
    return (
        <StoreContext.Provider value={store}>
            {children}
        </StoreContext.Provider>
    );
};

export { StoreContext, StoreProvider };