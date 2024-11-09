import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { deleteStorageCartItem, storeOrderLocally } from "./StorageFunction";
import { clearCart } from "../reduxtoolkit/CartSlice";
import Cartdetails from "./Cartdetails";
import { applyPromoCode, clearPromoCode } from "../reduxtoolkit/deliverySlice";

const Checkout = () => {
  const location = useLocation();
  const checkoutItems = location.state?.checkoutItem;
  const [promoCode, setPromoCode] = useState("");
  const deliveryFee = useSelector((state) => state.delivery.deliveryFee);
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const [userAddress, setUserAddress] = useState(null);
  const userId = useSelector((state) => state.auth.user?.id);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const navigate = useNavigate();
  const [promoCodeValid, setPromoCodeValid] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const promoCodes = useSelector((state) => state.delivery.promoCodes);
  const [addressValue, setAddressValue] = useState("");
  const [countryValue, setCountryValue] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zipValue, setZipValue] = useState("");
  const [wasValidated,setWasValidated]=useState(false)
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login'); // Redirect to login page if user is not authenticated
    }
  }, [isAuthenticated, navigate]);
  let items = [];
  if (checkoutItems) {
    items = checkoutItems;
  } else {
    items = cartItems;
  }

  const handlePromoCodeApply = () => {
    if (promoCode) {
      dispatch(applyPromoCode(promoCode));
      setPromoCodeValid(true);
    } else {
      setPromoCodeValid(false);
    }
  };

  const handleClearPromoCode = () => {
    dispatch(clearPromoCode());
    setPromoCode("");
  };

  useEffect(() => {
    const fetchUserAddress = async () => {
      try {
        if (userId) {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${userId}`);
          const userData = await response.json();
          console.log(userData.address);
          setUserAddress(userData.address);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (isAuthenticated) {
      fetchUserAddress();
    }
  }, [isAuthenticated, userId]);

  const handleCheckout = (e) => {
    e.preventDefault();
    const form = e.target;
  
    const shouldValidateAddressFields = showAddressForm || (!isAuthenticated && !userAddress);
  
    if (!form.checkValidity() || (shouldValidateAddressFields && !validateAddressFields(form))) {
      form.classList.add('was-validated');
      setWasValidated(true); // Update the wasValidated state
      return;
    }
    const ccNumber = document.getElementById("cc-number").value;
    const ccCvv = document.getElementById("cc-cvv").value;

    // Check if the credit card number is 12 digits
    const isValidCcNumber = /^\d{12}$/.test(ccNumber);

    // Check if the CVV is 3 digits
    const isValidCvv = /^\d{3}$/.test(ccCvv);

    if (!isValidCcNumber || !isValidCvv) {
      // Display an error message or perform any other action
      alert("Invalid credit card number or CVV. Please check and try again.");
      return;
    }

    const subtotal = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const calculatedDeliveryFee = subtotal < 100 ? deliveryFee : 0;
    let total = subtotal + calculatedDeliveryFee;

    if (promoCode && promoCodes[promoCode]) {
      const discountPercentage = promoCodes[promoCode];
      const promoCodeDiscount = (subtotal * discountPercentage) / 100;
      total -= promoCodeDiscount;
    }
    let addressToStore;

  // Check if the user has entered a new address
  if (showAddressForm) {
    console.log("fff");
    // If a new address is entered during checkout, use it
    addressToStore = {
      city:addressValue+" "+countryValue,
      state:stateValue,
      zipcode:zipValue,
      
    };
    console.log(addressToStore);
  } else {
    console.log(userAddress);
    // Otherwise, use the user's default address
    addressToStore = userAddress;
  }
  console.log(addressToStore);


    // if (checkoutItems === undefined) {
      dispatch(clearCart());
      cartItems.forEach((item) => {
        deleteStorageCartItem("cartItems", userId, item.id,item.selectedSize);
      });
    // }
    

    storeOrderLocally(
      userId,
      items,
      total,
      promoCode,
      calculatedDeliveryFee,
      subtotal,
      promoCodes,
      addressToStore
    );
    dispatch(clearPromoCode());
    setPromoCode("");

    navigate("/confirmation");
  };
  const validateAddressFields = (form) => {
    console.log('Validating address fields...');
    console.log(addressValue+" "+countryValue+" "+stateValue+" "+zipValue);
   
  
    if (showAddressForm) {
      if (
        !addressValue ||
        !countryValue ||
        !stateValue ||
      
        !zipValue
       
      ) {
        console.log('Address fields are invalid');
        return false;
      }
    }
  
    console.log('Address fields are valid');
    return true;
  };

  return (
    <>
      <div className="container p-0">
        <div className="row g-5 my-4 mx-4 flex-md-row flex-column-reverse">
          <div className="col-md-7 col-lg-8 ps-0">
            <h4 className="mb-3">Shipping address</h4>
            {isAuthenticated && userAddress && !showAddressForm && (
              <div>
                <p>
                  Address: {userAddress.street}, {userAddress.suite},{" "}
                  {userAddress.city}, {userAddress.zipcode}
                </p>
              </div>
            )}
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="changeAddress"
                checked={showAddressForm}
                onChange={(e) => setShowAddressForm(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="changeAddress">
                Change Address
              </label>
            </div>
            {(!isAuthenticated || showAddressForm) && (
              <form
                className="needs-validation"
                onSubmit={handleCheckout}
                noValidate
              >
                <div className="row g-3">
                  {/* <div className="col-sm-6">
                    <label htmlFor="firstName" className="form-label">
                      First name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="firstName"
                      placeholder=""
                      required
                    />
                    <div className="invalid-feedback">
                      Valid first name is required.
                    </div>
                  </div> */}
                  {/* <div className="col-sm-6">
                    <label htmlFor="lastName" className="form-label">
                      Last name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="lastName"
                      placeholder=""
                      required
                    />
                    <div className="invalid-feedback">
                      Valid last name is required.
                    </div>
                  </div> */}
                  <div className="col-12">
                    <label htmlFor="email" className="form-label">
                      Email <span className="text-muted">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="you@example.com"
                    />
                    <div className="invalid-feedback">
                      Please enter a valid email address for shipping updates.
                    </div>
                  </div>
                  <div className="col-12">
                    <label htmlFor="address" className="form-label">
                      Address
                    </label>
                    <input
                      type="text"
                      className={`form-control ${showAddressForm && !addressValue && wasValidated ? 'is-invalid' : ''}`}
                      id="address"
                      placeholder="1234 Main St"
                      required={showAddressForm}
                      value={addressValue}
                      onChange={(e) => setAddressValue(e.target.value)}
                    />
                    {showAddressForm && !addressValue && (
                      <div className="invalid-feedback">
                        Please enter your shipping address.
                      </div>
                    )}
                  </div>

                  <div className="col-md-5">
                    <label htmlFor="country" className="form-label">
                      Country
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        showAddressForm && !countryValue && wasValidated ? "is-invalid" : ""
                      }`}
                      id="country"
                      placeholder="United States"
                      required={showAddressForm}
                      value={countryValue}
                      onChange={(e) => setCountryValue(e.target.value)}
                    />
                    {showAddressForm && !countryValue && (
                      <div className="invalid-feedback">
                        Please select a valid country.
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="state" className="form-label">
                      State
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        showAddressForm && !stateValue && wasValidated? "is-invalid" : ""
                      }`}
                      id="state"
                      placeholder="State"
                      required={showAddressForm}
                      value={stateValue}
                      onChange={(e) => setStateValue(e.target.value)}
                    />
                    {showAddressForm && !stateValue && (
                      <div className="invalid-feedback">
                        Please provide a valid state.
                      </div>
                    )}
                  </div>

                  <div className="col-md-3">
                    <label htmlFor="zip" className="form-label">
                      Zip
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        showAddressForm && !zipValue && wasValidated ? "is-invalid" : ""
                      }`}
                      id="zip"
                      placeholder=""
                      required={showAddressForm}
                      value={zipValue}
                      onChange={(e) => setZipValue(e.target.value)}
                    />
                    {showAddressForm && !zipValue && (
                      <div className="invalid-feedback">Zip code required.</div>
                    )}
                  </div>
                </div>
              </form>
            )}

            <h4 className="mb-3">Payment</h4>
            <form
              className="needs-validation"
              onSubmit={handleCheckout}
              noValidate
            >
              <div className="my-3">
                <div className="form-check">
                  <input
                    id="credit"
                    name="paymentMethod"
                    type="radio"
                    className="form-check-input"
                    defaultChecked
                    required
                  />
                  <label className="form-check-label" htmlFor="credit">
                    Credit card
                  </label>
                </div>
                <div className="form-check">
                  <input
                    id="debit"
                    name="paymentMethod"
                    type="radio"
                    className="form-check-input"
                    required
                  />
                  <label className="form-check-label" htmlFor="debit">
                    Debit card
                  </label>
                </div>
                <div className="form-check">
                  <input
                    id="paypal"
                    name="paymentMethod"
                    type="radio"
                    className="form-check-input"
                    required
                  />
                  <label className="form-check-label" htmlFor="paypal">
                    PayPal
                  </label>
                </div>
              </div>
              <div className="row gy-3 my-4 ">
                <div className="col-md-6">
                  <label htmlFor="cc-name" className="form-label">
                    Name on card
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="cc-name"
                    placeholder=""
                    required
                  />
                  <small className="text-muted">
                    Full name as displayed on card
                  </small>
                  <div className="invalid-feedback">
                    Name on card is required.
                  </div>
                </div>
                <div className="col-md-6">
                  <label htmlFor="cc-number" className="form-label">
                    Credit card number
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="cc-number"
                    placeholder=""
                    pattern="\d{12}"
                    required
                  />
                  <div className="invalid-feedback">
                    Credit card number is required.
                  </div>
                </div>
                <div className="col-md-3">
                  <label htmlFor="cc-expiration" className="form-label">
                    Expiration
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="cc-expiration"
                    placeholder="MM/YYYY"
                    pattern="(0[1-9]|1[0-2])\/\d{4}"
                    required
                  />
                  <div className="invalid-feedback">
                    Expiration date required.
                  </div>
                </div>
                <div className="col-md-3">
                  <label htmlFor="cc-cvv" className="form-label">
                    CVV
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="cc-cvv"
                    placeholder="CVV"
                    pattern="\d{3}"
                    required
                  />
                  <div className="invalid-feedback">
                    Security code required.
                  </div>
                </div>
              </div>

              <button
                className="btn btn-fa btn-danger border-0 rounded-0"
                type="submit"
              >
                Continue to checkout
              </button>
            </form>
          </div>

          <div className="col-md-5 col-lg-4 order-md-last px-0">
            <div className="mb-4">
              <form className="card p-1">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handlePromoCodeApply}
                  >
                    Redeem
                  </button>
                  {promoCode && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleClearPromoCode}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
              {!promoCodeValid && (
                <p className="text-muted">Please enter a valid promo code</p>
              )}
            </div>
            <Cartdetails items={items} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
