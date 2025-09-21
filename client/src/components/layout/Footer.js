import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const [showPayPal, setShowPayPal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [isRendering, setIsRendering] = useState(false);
  const renderTimeoutRef = useRef(null);
  const paypalButtonsRef = useRef(null);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  const handlePayPalClick = () => {
    setShowPayPal(true);
  };

  const handlePayPalClose = () => {
    setShowPayPal(false);
  };

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
  };

  const handleCustomAmountChange = (e) => {
    const amount = parseFloat(e.target.value);
    if (!isNaN(amount) && amount > 0) {
      setSelectedAmount(amount);
    }
  };

  useEffect(() => {
    if (showPayPal) {
      // Clear any existing timeout
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }

      // Add global error handler for PayPal
      const handlePayPalError = (event) => {
        if (event.error && event.error.message && event.error.message.includes('paypal')) {
          console.error('PayPal global error:', event.error);
          event.preventDefault();
          return false;
        }
      };
      
      window.addEventListener('error', handlePayPalError);

      // Debounce the rendering to prevent rapid re-renders
      renderTimeoutRef.current = setTimeout(() => {
        if (isRendering) {
          return; // Don't render if already rendering
        }
        
        setIsRendering(true);

        // Check if PayPal is already loaded
        if (window.paypal) {
          renderPayPalButtons();
        } else {
          // Load PayPal SDK
          const script = document.createElement('script');
          script.src = 'https://www.paypal.com/sdk/js?client-id=AYz3lvMot3t7_J1HH80tKMfH1DSy0K0_qaFBgnD1zEXj9ht2s4yTfeHnl8MEQxw8HeVlcb59zLUZdt2h&currency=USD';
          script.async = true;
          script.onerror = () => {
            console.error('Failed to load PayPal SDK');
            alert('Failed to load payment system. Please refresh the page and try again.');
            setIsRendering(false);
            window.removeEventListener('error', handlePayPalError);
          };
          document.body.appendChild(script);

          script.onload = () => {
            if (window.paypal) {
              renderPayPalButtons();
            } else {
              console.error('PayPal SDK loaded but window.paypal is not available');
              alert('Payment system not available. Please try again later.');
              setIsRendering(false);
            }
          };
        }
      }, 300); // 300ms debounce

      return () => {
        // Cleanup
        if (renderTimeoutRef.current) {
          clearTimeout(renderTimeoutRef.current);
        }
        window.removeEventListener('error', handlePayPalError);
        setIsRendering(false);
      };
    }
  }, [showPayPal, selectedAmount]);

  const renderPayPalButtons = () => {
    try {
      const buttonContainer = document.getElementById('paypal-button');
      if (!buttonContainer) {
        console.error('PayPal button container not found');
        setIsRendering(false);
        return;
      }

      if (!window.paypal) {
        console.error('PayPal SDK not available');
        setIsRendering(false);
        return;
      }

      const buttons = window.paypal.Buttons({
        createOrder: function(data, actions) {
          try {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: selectedAmount.toString()
                }
              }]
            });
          } catch (error) {
            console.error('Error creating PayPal order:', error);
            throw error;
          }
        },
        onApprove: function(data, actions) {
          try {
            return actions.order.capture().then(function(details) {
              alert('Thank you for your donation!');
              handlePayPalClose();
            });
          } catch (error) {
            console.error('Error capturing PayPal order:', error);
            alert('Payment processing failed. Please try again.');
          }
        },
        onError: function(err) {
          console.error('PayPal error:', err);
          alert('Payment failed. Please try again.');
        },
        onCancel: function(data) {
          console.log('PayPal payment cancelled:', data);
        }
      });

      // Store reference for cleanup
      paypalButtonsRef.current = buttons;

      buttons.render('#paypal-button').then(() => {
        setIsRendering(false);
      }).catch(function(error) {
        console.error('Error rendering PayPal buttons:', error);
        setIsRendering(false);
      });
    } catch (error) {
      console.error('Error in renderPayPalButtons:', error);
      setIsRendering(false);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link to="/feedback" className="footer-link">
            Give Feedback
          </Link>
          <span className="footer-separator">•</span>
          <Link to="/patch-notes" className="footer-link">
            Patch Notes
          </Link>
          <span className="footer-separator">•</span>
          <a href="#" onClick={handlePayPalClick} className="footer-link">
            Support Development
          </a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 Management Web App. All rights reserved.</p>
      </div>
      
      {/* PayPal Modal */}
      {showPayPal && (
        <div className="paypal-modal-overlay" onClick={handlePayPalClose}>
          <div className="paypal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="paypal-modal-header">
              <h3>Support Development</h3>
              <button className="paypal-close" onClick={handlePayPalClose}>×</button>
            </div>
            <div className="paypal-modal-content">
              <p>If you find this application useful, consider supporting its development!</p>
              
              <div className="paypal-options">
                <div className="paypal-amount">
                  <h4>Choose amount:</h4>
                  <div className="amount-buttons">
                    <button 
                      className={`amount-btn ${selectedAmount === 3 ? 'selected' : ''}`}
                      onClick={() => handleAmountSelect(3)}
                    >
                      $3
                    </button>
                    <button 
                      className={`amount-btn ${selectedAmount === 5 ? 'selected' : ''}`}
                      onClick={() => handleAmountSelect(5)}
                    >
                      $5
                    </button>
                    <button 
                      className={`amount-btn ${selectedAmount === 10 ? 'selected' : ''}`}
                      onClick={() => handleAmountSelect(10)}
                    >
                      $10
                    </button>
                    <button 
                      className={`amount-btn ${selectedAmount === 20 ? 'selected' : ''}`}
                      onClick={() => handleAmountSelect(20)}
                    >
                      $20
                    </button>
                  </div>
                </div>
                
                <div className="paypal-custom">
                  <label htmlFor="custom-amount">Custom amount:</label>
                  <input 
                    type="number" 
                    id="custom-amount" 
                    placeholder="Enter amount" 
                    min="1" 
                    step="0.01"
                    value={selectedAmount}
                    onChange={handleCustomAmountChange}
                  />
                </div>
              </div>
              
              <div className="paypal-button-container">
                <div 
                  id="paypal-button" 
                  key={`paypal-${selectedAmount}-${showPayPal}`}
                >
                  {isRendering && (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '20px', 
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      Loading payment system...
                    </div>
                  )}
                </div>
              </div>
              
              <p className="paypal-note">
                * This will open PayPal in a new window for secure payment
                <br />
                <strong>Note:</strong> PayPal integration is now configured and ready to use
              </p>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
