import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

const options = [
  { value: 1, text: "Jan" },
  { value: 2, text: "Feb" },
  { value: 3, text: "Mar" },
  { value: 4, text: "Apr" },
  { value: 5, text: "May" },
  { value: 6, text: "Jun" },
  { value: 7, text: "Jul" },
  { value: 8, text: "Aug" },
  { value: 9, text: "Sep" },
  { value: 10, text: "Oct" },
  { value: 11, text: "Nov" },
  { value: 12, text: "Dec" },
];

const BASE_URL = "http://localhost:3000";
const LIMIT = 2;

function App() {
  const [selectedOption, setSelectedOption] = useState(options[2].value);
  const [searchInput, setSearchInput] = useState("");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);
  const [statsData, setStatsData] = useState();
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const fetchData = async () => {
    if (isLastPage) {
      return;
    }
    try {
      // http://localhost:3000/transactions?offset=1&limit=10&q=Backpack
      // @@@: remove hardcoded page and offset
      const offset = page * LIMIT;
      setIsLoading(true);
      const url = `${BASE_URL}/transactions?offset=${offset}&limit=${LIMIT}&month=${selectedOption}&q=${searchInput}`;
      const response = await fetch(url);
      const result = await response.json();
      console.log("result:", result);
      if (result?.response?.length > 0) {
        setData(result);
      } else {
        setPage(page - 1);
        setIsLastPage(true);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("failed to fetch data from API, error:", error);
      setIsLoading(false);
    }
  };

  // http://localhost:3000/stats?month=7
  const fetchStatsData = async () => {
    setIsStatsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/stats?month=${selectedOption}`
      );
      const responseJson = await response.json();
      setStatsData(responseJson);
      console.log("stats data:", responseJson);
      setIsStatsLoading(false);
    } catch (error) {
      setIsStatsLoading(false);
      console.error("failed to fetch stats data, error:", error);
    }
  };

  useEffect(() => {
    if (data?.response?.length < LIMIT) {
      setIsLastPage(true);
    } else {
      setIsLastPage(false);
    }
  }, [data]);

  useEffect(() => {
    fetchData();
    fetchStatsData();
  }, [searchInput, selectedOption, page]);

  const searchInputChangeHandler = (e) => {
    setSearchInput(e.target.value);
    console.log("search input:", searchInput);
  };

  const monthChangeHandler = (e) => {
    setSelectedOption(e.target.value);
    console.log("selected option:", JSON.stringify(selectedOption));
  };

  const paginationNextHandler = () => {
    if (isLastPage) {
      console.log("Last page occured");
      return;
    }
    setPage(page + 1);
  };

  const paginationPrevHandler = () => {
    if (page === 0) {
      console.log("Is first page");
      return;
    }
    setIsLastPage(false);
    setPage(page - 1);
  };

  return (
    <>
      <h1>Transaction Dashboard</h1>
      <div className="above-table">
        <input
          type="text"
          placeholder="Search Transaction"
          value={searchInput}
          onChange={searchInputChangeHandler}
        />
        <select value={selectedOption} onChange={monthChangeHandler}>
          {/* @@@: make selected */}
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.text}
            </option>
          ))}
        </select>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Category</th>
            <th>Sold</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {/* @@@todo: better loading? */}
          {isLoading ? (
            <tr></tr>
          ) : data ? (
            data.response.map((dataRow) => (
              <tr key={dataRow.id}>
                <td>{dataRow.id}</td>
                <td>{dataRow.title}</td>
                <td>{dataRow.description}</td>
                <td>{dataRow.price}</td>
                <td>{dataRow.category}</td>
                <td>{dataRow.sold ? "true" : "false"}</td>
                <td>
                  <img
                    src={dataRow.image}
                    alt="Placeholder image"
                    style={{ height: "100px", width: "100px" }}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr></tr>
          )}
        </tbody>
      </table>
      <div className="pagination">
        <span>Page No: {page + 1}</span>
        <div>
          <span className="pagination-next" onClick={paginationNextHandler}>
            Next
          </span>
          <span className="pagination-sep">-</span>
          <span className="pagination-prev" onClick={paginationPrevHandler}>
            Previous
          </span>
        </div>
        <span>Per page: {LIMIT}</span>
      </div>
      {isStatsLoading ? (
        "Stats loading..."
      ) : (
        <div>
          <h1>Statistics - {options[selectedOption - 1].text}</h1>
          <div>
            <p>
              Total Sales: {statsData.response.textResponse.totalSalesByMonth}
            </p>
            <p>
              Total Sold items:{" "}
              {statsData.response.textResponse.itemSoldByMonth}
            </p>
            <p>
              Total not sold items:{" "}
              {statsData.response.textResponse.itemsNotSoldByMonth}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
