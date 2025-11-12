import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import HistoryBooked from "./pages/HistoryBooked/HistoryBooked";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import AppLayout from "./layout/AppLayout";
import LimitBooking from "./pages/PhoneNumbers/LimitBooking";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProviderPage from "./pages/ProviderPages/ProviderPage";
import TypeNumber from "./pages/TypeNumber/TypeNumber";
import PhoneNumbers from "./pages/PhoneNumbers/PhoneStatus";
import PhoneNumberFilters from "./pages/PhoneNumbers/PhoneFilter";
import UploadExcel from "./pages/PhoneNumbers/UploadExcel";
import { Provider } from "react-redux";
import { store } from "./store";
import { PrivateRoute } from "./routes/privateRoutes";
import { PublicRoute } from "./routes/publicRoute";
import DigitalChannel from "./pages/DigitalChannel/DigitalChannel";
import { AuthProvider, useAuth } from "./context/SocketContext";
import { useEffect } from "react";
import { setAxiosInactivityHandler } from "./config/apiToken";
import { Toaster } from "react-hot-toast";
import SessionPage from "./pages/SessionPages/SessionPage";
import { useLocation } from "react-router";
import { useDispatch } from "react-redux";
import { resetSelectedIds } from "./store/selectedPhoneSlice";
import { PlanList } from "./pages/Plan/PlanList";
import { PlanActionPage } from "./pages/Plan/PlanAction";
import { SubcriptionActionPage } from "./pages/Subscription/SubscriptionAction";
import SubscriptionList from "./pages/Subscription/SubscriptionList";
import LogList from "./pages/Logs/LogList";
import OrderList from "./pages/Order/OrderList";
import { OrderActionPage } from "./pages/Order/OrderAction";

function AppWithInactivityHandler() {
  const { resetInactivityTimer } = useAuth();

  useEffect(() => {
    setAxiosInactivityHandler(resetInactivityTimer);
  }, [resetInactivityTimer]);

  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(resetSelectedIds());
  }, [location.pathname]);

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/signin" element={<SignIn />} />
      </Route>
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/basic-tables" element={<BasicTables />} />
          <Route path="/form-elements" element={<FormElements />} />
          <Route index path="/" element={<Home />} />
          <Route path="/history-booked" element={<HistoryBooked />} />
          <Route path="/digital-channel" element={<DigitalChannel />} />
          <Route
            path="/phone-numbers"
            element={<PhoneNumberFilters key="phone-filter" />}
          />
          <Route
            path="/phone-numbers-for-status"
            element={<PhoneNumbers key="phone-status" />}
          />
          <Route path="/plans" element={<PlanList />} />
          <Route path="/plans/create" element={<PlanActionPage />} />
          <Route path="/plans/edit/:id" element={<PlanActionPage />} />{" "}
          <Route path="/order" element={<OrderList />} />
          <Route path="/order/edit/:id" element={<OrderActionPage />} />
          <Route path="/order/detail/:id" element={<OrderActionPage />} />
          <Route path="/order/create" element={<OrderActionPage />} />
          <Route path="/subscriptions" element={<SubscriptionList />} />
          <Route
            path="/subscriptions/create"
            element={<SubcriptionActionPage />}
          />
          <Route
            path="/subscriptions/detail/:id"
            element={<SubcriptionActionPage />}
          />
        </Route>
      </Route>
      <Route element={<PrivateRoute requiredRole="1" />}>
        <Route element={<AppLayout />}>
          <Route path="/providers" element={<ProviderPage />} />
          <Route path="/upload-file" element={<UploadExcel />} />
          <Route path="/type-numbers" element={<TypeNumber />} />
          <Route path="/limit-booking" element={<LimitBooking />} />
          <Route path="/time-online" element={<SessionPage />} />
          <Route path="/logs" element={<LogList />} />
          <Route
            path="/subscriptions/edit/:id"
            element={<SubcriptionActionPage />}
          />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
      <Route path="/unauthorized" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <AppWithInactivityHandler />
        </AuthProvider>
        <Toaster />
      </Router>
    </Provider>
  );
}
