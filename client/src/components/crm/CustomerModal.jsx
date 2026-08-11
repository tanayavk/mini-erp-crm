// import React, { useState, useEffect } from 'react';
// import api from '../../services/api';

// export const CustomerModal = ({ isOpen, onClose, customerToEdit, onSuccess }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     business_name: '',
//     mobile: '',
//     email: '',
//     gst_number: '',
//     address: '',
//     type: 'Retail',
//     status: 'Lead',
//   });

//   const [fieldErrors, setFieldErrors] = useState({});
//   const [generalError, setGeneralError] = useState('');
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     if (customerToEdit) {
//       setFormData({
//         name: customerToEdit.name || '',
//         business_name: customerToEdit.business_name || '',
//         mobile: customerToEdit.mobile || '',
//         email: customerToEdit.email || '',
//         gst_number: customerToEdit.gst_number || '',
//         address: customerToEdit.address || '',
//         type: customerToEdit.type || 'Retail',
//         status: customerToEdit.status || 'Lead',
//       });
//     } else {
//       setFormData({
//         name: '',
//         business_name: '',
//         mobile: '',
//         email: '',
//         gst_number: '',
//         address: '',
//         type: 'Retail',
//         status: 'Lead',
//       });
//     }
//     setFieldErrors({});
//     setGeneralError('');
//   }, [customerToEdit, isOpen]);

//   if (!isOpen) return null;

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     if (fieldErrors[name]) {
//       setFieldErrors((prev) => ({ ...prev, [name]: null }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);
//     setFieldErrors({});
//     setGeneralError('');

//     try {
//       if (customerToEdit) {
//         await api.put(`/customers/${customerToEdit.id}`, formData);
//       } else {
//         await api.post('/customers', formData);
//       }
//       onSuccess();
//       onClose();
//     } catch (err) {
//       const responseData = err.response?.data;
//       if (err.response?.status === 400 && Array.isArray(responseData?.error)) {
//         const errorsObj = {};
//         responseData.error.forEach((item) => {
//           if (item.field) errorsObj[item.field] = item.message;
//         });
//         setFieldErrors(errorsObj);
//       } else {
//         setGeneralError(responseData?.message || 'Failed to save customer details.');
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//       <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl border border-gray-200">
//         <div className="flex items-center justify-between border-b border-gray-200 pb-4">
//           <h3 className="text-xl font-bold text-gray-800">
//             {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
//           </h3>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600 text-2xl font-semibold leading-none"
//           >
//             &times;
//           </button>
//         </div>

//         {generalError && (
//           <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
//             {generalError}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="mt-4 space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
//                 Contact Name *
//               </label>
//               <input
//                 type="text"
//                 name="name"
//                 required
//                 value={formData.name}
//                 onChange={handleChange}
//                 className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
//                   fieldErrors.name ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
//                 }`}
//                 placeholder="John Doe"
//               />
//               {fieldErrors.name && (
//                 <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
//                 Business Name *
//               </label>
//               <input
//                 type="text"
//                 name="business_name"
//                 required
//                 value={formData.business_name}
//                 onChange={handleChange}
//                 className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
//                   fieldErrors.business_name ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
//                 }`}
//                 placeholder="Acme Logistics Pvt Ltd"
//               />
//               {fieldErrors.business_name && (
//                 <p className="mt-1 text-xs text-red-600">{fieldErrors.business_name}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
//                 Mobile Number *
//               </label>
//               <input
//                 type="text"
//                 name="mobile"
//                 required
//                 value={formData.mobile}
//                 onChange={handleChange}
//                 className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
//                   fieldErrors.mobile ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
//                 }`}
//                 placeholder="+19876543210"
//               />
//               {fieldErrors.mobile && (
//                 <p className="mt-1 text-xs text-red-600">{fieldErrors.mobile}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
//                 Email Address *
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 required
//                 value={formData.email}
//                 onChange={handleChange}
//                 className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
//                   fieldErrors.email ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
//                 }`}
//                 placeholder="contact@acme.com"
//               />
//               {fieldErrors.email && (
//                 <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
//                 GST Number
//               </label>
//               <input
//                 type="text"
//                 name="gst_number"
//                 value={formData.gst_number}
//                 onChange={handleChange}
//                 className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
//                   fieldErrors.gst_number ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
//                 }`}
//                 placeholder="27AABCU9603R1ZM"
//               />
//               {fieldErrors.gst_number && (
//                 <p className="mt-1 text-xs text-red-600">{fieldErrors.gst_number}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
//                 Customer Type *
//               </label>
//               <select
//                 name="type"
//                 value={formData.type}
//                 onChange={handleChange}
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
//               >
//                 <option value="Retail">Retail</option>
//                 <option value="Wholesale">Wholesale</option>
//                 <option value="Distributor">Distributor</option>
//                 <option value="Lead">Lead</option>
//               </select>
//             </div>
//           </div>

//           <div>
//             <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
//               Customer Status *
//             </label>
//             <div className="flex gap-4">
//               {['Lead', 'Active', 'Inactive'].map((st) => (
//                 <label key={st} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="status"
//                     value={st}
//                     checked={formData.status === st}
//                     onChange={handleChange}
//                     className="text-blue-600 focus:ring-blue-500"
//                   />
//                   {st}
//                 </label>
//               ))}
//             </div>
//           </div>

//           <div>
//             <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
//               Full Address *
//             </label>
//             <textarea
//               name="address"
//               required
//               rows={2}
//               value={formData.address}
//               onChange={handleChange}
//               className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
//                 fieldErrors.address ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
//               }`}
//               placeholder="742 Evergreen Terrace, Springfield"
//             />
//             {fieldErrors.address && (
//               <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p>
//             )}
//           </div>

//           <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 mt-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={submitting}
//               className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
//             >
//               {submitting ? 'Saving...' : customerToEdit ? 'Update Customer' : 'Create Customer'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const CustomerModal = ({ isOpen, onClose, customerToEdit, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    mobile: '',
    email: '',
    gst_number: '',
    address: '',
    type: 'Retail',
    status: 'Lead',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        name: customerToEdit.name || '',
        business_name: customerToEdit.business_name || '',
        mobile: customerToEdit.mobile || '',
        email: customerToEdit.email || '',
        gst_number: customerToEdit.gst_number || '',
        address: customerToEdit.address || '',
        type: customerToEdit.type || 'Retail',
        status: customerToEdit.status || 'Lead',
      });
    } else {
      setFormData({
        name: '',
        business_name: '',
        mobile: '',
        email: '',
        gst_number: '',
        address: '',
        type: 'Retail',
        status: 'Lead',
      });
    }
    setFieldErrors({});
    setGeneralError('');
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError('');

    // Pre-validation check for 10-digit Indian Mobile Number
    const cleanedMobile = formData.mobile.replace(/\D/g, '');
    if (cleanedMobile.length !== 10 && !/^\+91[6-9]\d{9}$/.test(formData.mobile)) {
      setFieldErrors({
        mobile: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +919876543210).'
      });
      setSubmitting(false);
      return;
    }

    try {
      if (customerToEdit) {
        await api.put(`/customers/${customerToEdit.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const responseData = err.response?.data;
      if (err.response?.status === 400 && Array.isArray(responseData?.error)) {
        const errorsObj = {};
        responseData.error.forEach((item) => {
          if (item.field) errorsObj[item.field] = item.message;
        });
        setFieldErrors(errorsObj);
      } else {
        setGeneralError(responseData?.message || 'Failed to save customer details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {customerToEdit ? 'Edit Customer Details' : 'Add New Indian Customer'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold leading-none"
          >
            &times;
          </button>
        </div>

        {generalError && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  fieldErrors.name ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="e.g. Rajesh Kumar"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                name="business_name"
                required
                value={formData.business_name}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  fieldErrors.business_name ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="e.g. Shree Ram Enterprises Pvt Ltd"
              />
              {fieldErrors.business_name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.business_name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Mobile Number (+91 - 10 Digits) *
              </label>
              <input
                type="text"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  fieldErrors.mobile ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="+91 9876543210"
              />
              {fieldErrors.mobile && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.mobile}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  fieldErrors.email ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="rajesh@shreeram.in"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                GSTIN (GST Number)
              </label>
              <input
                type="text"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  fieldErrors.gst_number ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="29AABCU9603R1ZM"
              />
              {fieldErrors.gst_number && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.gst_number}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Customer Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Customer Status *
            </label>
            <div className="flex gap-4">
              {['Lead', 'Active', 'Inactive'].map((st) => (
                <label key={st} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={st}
                    checked={formData.status === st}
                    onChange={handleChange}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  {st}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Complete Business Address *
            </label>
            <textarea
              name="address"
              required
              rows={2}
              value={formData.address}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                fieldErrors.address ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="Plot No. 42, Industrial Area Phase II, Bengaluru, Karnataka - 560058"
            />
            {fieldErrors.address && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Saving...' : customerToEdit ? 'Update Details' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};