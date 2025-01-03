import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import Axios
import ModalTemplate from "../Components/Modal";
import { getFromLocalStorage } from "../Helper/localStorageHelper";

const ITEMS_PER_PAGE = 5;

const Dashboard = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [formError, setFormError] = useState("");

    const [divisions, setDivisions] = useState([]);

    const [formData, setFormData] = useState({
        image: null,
        name: "",
        phone: "",
        division: "",
        position: "",
    });

    const handleFormChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "image") {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [additionalErrorMessage, setAdditionalErrorMessage] = useState("");

    const api = axios.create({
        baseURL: "https://aksamedia-syahreza-be-test.vercel.app/api/api",
        headers: {
            "Content-Type": "application/json",
        },
    })

    const fetchEmployees = async (page = 1) => {
        setLoading(true);
        setErrorMessage("");
        try {
            const token = getFromLocalStorage("token");
            const response = await api.get("/employees", {
                params: {
                    page,
                },
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });
            const { employees } = response.data.data;
            const { total_pages } = response.data.pagination;

            setEmployees(employees);
            setTotalPages(total_pages);
            setCurrentPage(page);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Failed to fetch employee data."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchDivisions = async () => {
        try {
            const token = getFromLocalStorage("token");
            const response = await api.get("/divisions", {
                params: {
                    per_page: 6,
                },

                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const divisions = response.data.data.divisions;
            setDivisions(divisions);
        } catch (error) {
            setAdditionalErrorMessage(
                error.response?.data?.message || "Failed to fetch division data."
            );
        };
    };

    useEffect(() => {
        fetchEmployees(currentPage);
        fetchDivisions();
    }, [currentPage]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredEmployees = employees.filter((employee) =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            fetchEmployees(page);
        }
    };

    const handleAddEmployee = () => {
        setFormData({
            image: null,
            name: "",
            phone: "",
            division: "",
            position: "",
        });
        setIsAddModalOpen(true);
    };

    const handleEditEmployee = (employee) => {
        setCurrentEmployee(employee);
        setFormData({
            image: null,
            name: employee.name,
            phone: employee.phone,
            division: employee.division.id,
            position: employee.position,
        });

        setIsEditModalOpen(true);
    };

    const handleDeleteEmployee = async (employee) => {
        try {
            const token = getFromLocalStorage("token");
            const response = await api.delete(`/employees/${employee.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });
        } catch (error) {
            setAdditionalErrorMessage(
                error.response?.data?.message || "Failed to delete employee."
            );
        } finally {
            fetchEmployees(currentPage);
        }
    };

    const handleSaveNewEmployee = async () => {
        if (!formData.image || !formData.name || !formData.phone || !formData.division || !formData.position) {
            setFormError("All fields are required.");
            return;
        }

        try {
            const token = getFromLocalStorage("token");

            const data = new FormData();
            data.append("image", formData.image);
            data.append("name", formData.name);
            data.append("phone", formData.phone);
            data.append("division", formData.division);
            data.append("position", formData.position);

            const response = await api.post("/employees", data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            fetchEmployees(currentPage);
            setIsAddModalOpen(false);
        } catch (error) {
            if (error.response?.data?.data) {
                const validationMessages = Object.values(error.response.data.data).flat().join(", ");
                setFormError(validationMessages || "Failed to add new employee.");
            } else {
                setFormError(error.response?.data?.message);
            }
        }
    };

    const handleUpdateEmployee = async (employee) => {
        if (!Object.values(formData).some((value) => value)) {
            setFormError("At least one field must be filled.");
            return;
        }

        try {
            const token = getFromLocalStorage("token");

            const data = new FormData();
            data.append("_method", "PUT");

            Object.keys(formData).forEach((key) => {
                if (formData[key]) {
                    data.append(key, formData[key]);
                }
            });

            const response = await api.post(`/employees/${currentEmployee.id}`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            fetchEmployees(currentPage);
            setIsEditModalOpen(false);
        } catch (error) {
            if (error.response?.data?.data) {
                const validationMessages = Object.values(error.response.data.data).flat().join(", ");
                setFormError(validationMessages || "Failed to update employee.");
            } else {
                setFormError(error.response?.data?.message);
            }
        }
    };

    const handleViewDetails = (employee) => {
        setCurrentEmployee(employee);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="dark:bg-gray-800 bg-white dark:text-white text-black px-4 py-6 sm:px-6 lg:px-20 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
                <h1 className="text-xl sm:text-2xl font-bold">Employee Dashboard</h1>
                <button
                    onClick={handleAddEmployee}
                    className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
                >
                    Add Employee
                </button>
            </div>

            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="mb-4 w-full px-4 py-2 border rounded shadow-sm focus:ring focus:ring-blue-300 dark:bg-gray-800"
            />

            {loading ? (
                <p className="text-center">Loading...</p>
            ) : errorMessage ? (
                <p className="text-center text-red-500">{errorMessage}</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="border border-gray-300 px-4 py-2">Name</th>
                                    <th className="border border-gray-300 px-4 py-2">Phone</th>
                                    <th className="border border-gray-300 px-4 py-2">Division</th>
                                    <th className="border border-gray-300 px-4 py-2">Position</th>
                                    <th className="border border-gray-300 px-4 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((employee) => (
                                        <tr key={employee.id}>
                                            <td className="border border-gray-300 px-4 py-2">{employee.name}</td>
                                            <td className="border border-gray-300 px-4 py-2">{employee.phone}</td>
                                            <td className="border border-gray-300 px-4 py-2">{employee.division.name}</td>
                                            <td className="border border-gray-300 px-4 py-2">{employee.position}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <button
                                                    onClick={() => handleEditEmployee(employee)}
                                                    className="bg-yellow-500 text-white px-3 py-1 rounded shadow hover:bg-yellow-600 mr-2 mb-2 mt-2"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEmployee(employee)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 mr-2 mb-2"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    onClick={() => handleViewDetails(employee)}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded shadow hover:bg-blue-600 mb-2"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="text-center py-4 text-gray-500 font-medium"
                                        >
                                            No employees found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="mt-4 flex justify-between items-center">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )}

            {additionalErrorMessage && (
                <p className="text-center text-red-500 mt-4">{additionalErrorMessage}</p>
            )}

            {isAddModalOpen && (
                <ModalTemplate
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title="Add Employee"
                    cancelLabel="Cancel"
                    submitLabel="Save"
                    onSubmit={handleSaveNewEmployee}
                >
                    <form>
                        {formError && <p className="text-red-500 mb-4">{formError}</p>}
                        <label className="block mb-2" for="employee-image-input">Add Employee Image</label>
                        <input
                            type="file"
                            name="image"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handleFormChange}
                            id="employee-image-input"
                            className="w-full mb-4 px-0 py-2 dark:bg-gray-800"
                        />
                        <input
                            type="text"
                            name="name"
                            onChange={handleFormChange}
                            placeholder="Name"
                            className="w-full mb-4 px-4 py-2 border rounded dark:bg-gray-800"
                        />
                        <input
                            type="text"
                            name="phone"
                            onChange={handleFormChange}
                            placeholder="Phone"
                            className="w-full mb-4 px-4 py-2 border rounded dark:bg-gray-800"
                        />

                        <label className="block mb-2" htmlFor="division-select">
                            Division
                        </label>
                        <select
                            name="division"
                            value={formData.division}
                            onChange={handleFormChange}
                            id="division-select"
                            className="w-full mb-4 px-2 py-2 border rounded dark:bg-gray-800"
                        >
                            <option value="" disabled>
                                Select Division
                            </option>
                            {divisions.map((division) => (
                                <option key={division.id} value={division.id}>
                                    {division.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            name="position"
                            onChange={handleFormChange}
                            placeholder="Position"
                            className="w-full mb-4 mt-3 px-4 py-2 border rounded dark:bg-gray-800"
                        />
                    </form>
                </ModalTemplate>
            )}

            {isEditModalOpen && (
                <ModalTemplate
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Edit"
                    cancelLabel="Cancel"
                    submitLabel="Save"
                    onSubmit={handleUpdateEmployee}
                >
                    <form>
                        {formError && <p className="text-red-500 mb-4">{formError}</p>}
                        <label className="block mb-2" for="employee-image-input">Add Employee Image</label>
                        <input
                            type="file"
                            name="image"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handleFormChange}
                            id="employee-image-input"
                            className="w-full mb-4 px-0 py-2 dark:bg-gray-800"
                        />
                        <input
                            type="text"
                            name="name"
                            onChange={handleFormChange}
                            value={formData.name}
                            placeholder="Name"
                            className="w-full mb-4 px-4 py-2 border rounded dark:bg-gray-800"
                        />
                        <input
                            type="text"
                            name="phone"
                            onChange={handleFormChange}
                            value={formData.phone}
                            placeholder="Phone"
                            className="w-full mb-4 px-4 py-2 border rounded dark:bg-gray-800"
                        />

                        <label className="block mb-2" htmlFor="division-select">
                            Division
                        </label>
                        <select
                            name="division"
                            value={formData.division}
                            onChange={handleFormChange}
                            id="division-select"
                            className="w-full mb-4 px-2 py-2 border rounded dark:bg-gray-800"
                        >
                            <option value="" disabled>
                                Select Division
                            </option>
                            {divisions.map((division) => (
                                <option key={division.id} value={division.id}>
                                    {division.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            name="position"
                            onChange={handleFormChange}
                            placeholder="Position"
                            value={formData.position}
                            className="w-full mb-4 mt-3 px-4 py-2 border rounded dark:bg-gray-800"
                        />
                    </form>
                </ModalTemplate>
            )}

            {currentEmployee && (
                <ModalTemplate
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title={`Detail Pegawai ${currentEmployee.name}`}
                    cancelLabel="Close"
                >

                    <div className="text-center">
                        <img
                            src={currentEmployee.image}
                            alt={`Foto ${currentEmployee.name}`}
                            className="mb-4 w-40 h-40 object-cover rounded-full mx-auto"
                        ></img>

                        <p className="mb-3"><strong>Name:</strong> {currentEmployee.name}</p>
                        <p className="mb-3"><strong>Phone:</strong> {currentEmployee.phone}</p>
                        <p className="mb-3"><strong>Division:</strong> {currentEmployee.division.name}</p>
                        <p className="mb-3"><strong>Position:</strong> {currentEmployee.position}</p>
                    </div>
                </ModalTemplate>
            )}
        </div>
    );
};

export default Dashboard;
