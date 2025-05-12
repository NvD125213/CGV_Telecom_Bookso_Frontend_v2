import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
// import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
// import UserProfiles from "./pages/UserProfiles";
import HistoryBooked from "./pages/HistoryBooked/HistoryBooked";
// import Videos from "./pages/UiElements/Videos";
// import Images from "./pages/UiElements/Images";
// import Alerts from "./pages/UiElements/Alerts";
// import Badges from "./pages/UiElements/Badges";
// import Avatars from "./pages/UiElements/Avatars";
// import Buttons from "./pages/UiElements/Buttons";
// import LineChart from "./pages/Charts/LineChart";
// import BarChart from "./pages/Charts/BarChart";
// import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
// import Blank from "./pages/Blank";
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
import DigitalChannel from "./pages/DigitalChannel/test";

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/signin" element={<SignIn />} />
            {/* <Route path="/signup" element={<SignUp />} /> */}
          </Route>

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/basic-tables" element={<BasicTables />} />

              <Route path="/form-elements" element={<FormElements />} />
              <Route index path="/" element={<Home />} />
              <Route path="/history-booked" element={<HistoryBooked />} />
              <Route path="/digital-channel" element={<DigitalChannel />} />
              {/* 
              <Route path="/calendar" element={<Calendar />} /> */}
              {/* <Route path="/blank" element={<Blank />} /> */}
              {/* 
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} /> */}
              <Route path="/phone-numbers" element={<PhoneNumberFilters />} />
              <Route
                path="/phone-numbers-for-status"
                element={<PhoneNumbers />}
              />
            </Route>
          </Route>
          <Route element={<PrivateRoute requiredRole="1" />}>
            <Route element={<AppLayout />}>
              <Route path="/providers" element={<ProviderPage />} />
              <Route path="/upload-file" element={<UploadExcel />} />
              <Route path="/type-numbers" element={<TypeNumber />} />
              <Route path="/limit-booking" element={<LimitBooking />} />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
          <Route path="/unauthorized" element={<NotFound />} />
        </Routes>
      </Router>
    </Provider>
  );
}
