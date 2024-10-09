import "../styles/general.scss";
import { Provider } from "react-redux";
import { store } from "@/components/store/mainStore";
function MyApp({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
