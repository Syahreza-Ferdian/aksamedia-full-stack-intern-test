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

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        division: "",
        position: "",
    });

    const [loading, setLoading] = useState(false); // Loading state
    const [errorMessage, setErrorMessage] = useState(""); // Error message state

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
                headers : {
                    Authorization : `Bearer ${token}`
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

    useEffect(() => {
        fetchEmployees(currentPage);
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
            name: "",
            phone: "",
            division: "",
            position: "",
        });
        setIsAddModalOpen(true);
    };

    const handleEditEmployee = (employee) => {
        setCurrentEmployee(employee);
        setFormData(employee);
        setIsEditModalOpen(true);
    };

    const handleViewDetails = (employee) => {
        setCurrentEmployee(employee);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="dark:bg-gray-800 bg-white dark:text-white text-black p-20 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Employee Dashboard</h1>
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
                                                className="bg-yellow-500 text-white px-3 py-1 rounded shadow hover:bg-yellow-600 mr-2"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => console.log(`Delete employee ${employee.id}`)}
                                                className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => handleViewDetails(employee)}
                                                className="bg-blue-500 text-white px-3 py-1 rounded shadow hover:bg-blue-600 ml-2"
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
                </>
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
