// Fetch the data used in the Fitbit Dashboard graphs as a CSV

// 1. [Login](https://fitbit.com/login) to your Fitbit account
// 2. Navigate to the [Activities Dashboard](https://www.fitbit.com/activities)
// 3. Use the bookmarklet
// 4. Profit!

javascript: void (async function () {
  const getDatesBetween = (startDate, endDate) => {
    const dateArray = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dateArray.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
  };

  const fetchDataByDay = async (date) => {
    const ts = new Date().getTime();
    const url = `${baseUrl}?userId=${userId}&dateFrom=${date}&dateTo=${date}&ts=${ts}&type=intradaySteps&dataVersion=3&apiFormat=json`;
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
      referrer: "https://www.fitbit.com/activities",
      method: "GET",
      mode: "cors",
    });
    const data = await response.json();
    return data?.graph?.dataSets?.activity?.dataPoints;
  };

  const downloadCSV = (dataArray, name) => {
    const csvContent = dataArray
      .map((item, index) => {
        const values = Object.values(item);
        return (
          (index === 0 ? Object.keys(item).join(",") + "\n" : "") +
          values.join(",")
        );
      })
      .join("\n");

    // Create a Blob from the CSV string
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", name);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const userId = document.querySelector("body.fb-body").dataset.userId;
  const userName =
    document.querySelector("body.fb-body")?.dataset?.userName || "user";
  const startDate = window.prompt("Enter START date (YYYY-mm-dd)");
  const endDate = window.prompt("Enter END date (YYYY-mm-dd)");
  const baseUrl = "https://www.fitbit.com/graph/getNewGraphData";
  const dates = getDatesBetween(startDate, endDate);

  window.alert(`Fetching data from ${startDate} to ${endDate} for ${userName}`);
  const results = Array.flatten(
    await Promise.all(dates.map((d) => fetchDataByDay(d))),
  );
  const cleanedName = userName.replaceAll(" ", "-").replace(".", "");
  const csvName = `${cleanedName}-${startDate}.csv`;
  console.log(results);
  downloadCSV(results, csvName);
})();
