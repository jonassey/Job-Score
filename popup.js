document.querySelector('#search-btn').addEventListener('click', searchJobsAndCostOfLiving);

function searchJobsAndCostOfLiving() {
  const jobTitleInput = document.querySelector('#job-title');
  const jobLocationInput = document.querySelector('#job-location');
  const countryInput = document.querySelector('#country');

  // Get search criteria from form
  const jobTitle = jobTitleInput.value;
  const jobLocation = jobLocationInput.value;
  const country = countryInput.value;

  // Proxy server URL
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

  // Send request to job search API using the proxy server
  const jobApiUrl = `${proxyUrl}https://api.whatjobs.com/api/v1/jobs.xml?publisher=4500&user_ip=41.113.166.194&user_agent=Mozilla/5.0%20(Windows%20NT%2010.0;%20Win64;%20x64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/112.0.0.0%20Safari/537.36&keyword=${jobTitle}&location=${jobLocation}&limit=&page=`;

  fetch(jobApiUrl)
    .then(response => {
      if (response.status === 200) {
        return response.text();
      } else if (response.status === 503) {
        throw new Error('Service Unavailable');
      } else {
        throw new Error('Request failed');
      }
    })
    .then(data => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(data, 'application/xml');
      const jobs = xml.getElementsByTagName('job');

      const jobListings = document.querySelector('#job-listings');
      jobListings.innerHTML = '';

      // Process job listings data
      if (jobs.length === 0) {
        jobListings.innerHTML = '<p>No jobs found.</p>';
      } else {
        for (let i = 0; i < jobs.length; i++) {
          const jobTitleElem = jobs[i].getElementsByTagName('title')[0];
          const jobTitle = jobTitleElem ? jobTitleElem.textContent : '';
          const jobLocationElem = jobs[i].getElementsByTagName('location')[0];
          const jobLocation = jobLocationElem ? jobLocationElem.textContent : '';
          const jobDescriptionElem = jobs[i].getElementsByTagName('snippet')[0];
          const jobDescription = jobDescriptionElem ? jobDescriptionElem.textContent : '';
          const jobUrlElem = jobs[i].getElementsByTagName('url')[0];
          const jobUrl = jobUrlElem ? jobUrlElem.textContent : '';

          const jobListing = `
            <div class="job-listing">
              <h2>${jobTitle}</h2>
              <p><strong>Location:</strong> ${jobLocation}</p>
              <p><strong>Description:</strong> ${jobDescription}</p>
              <p><a href="${jobUrl}" target="_blank">Apply Now</a></p>
              <div class="cost-of-living" id="cost-of-living-${i}"></div>
            </div>
          `;
          jobListings.insertAdjacentHTML('beforeend', jobListing);
        }

        // Call the function to calculate and display the cost of living
        calculateCostOfLiving(country);
      }
    })
    .catch(error => {
      console.error(error);
      const jobListings = document.querySelector('#job-listings');
      jobListings.innerHTML = '<p>Failed to retrieve job listings. Please try again later.</p>';
    });
}

function calculateCostOfLiving(country) {
  // Construct URL for the desired country
  var url = 'https://www.numbeo.com/cost-of-living/country_result.jsp?country=' + country;
  var proxyUrl = 'https://cors-anywhere.herokuapp.com/' + url; // use a proxy server

  // Send a GET request to the URL and parse the HTML content
  fetch(proxyUrl)
    .then(response => response.text())
    .then(data => {
      var parser = new DOMParser();
      var htmlDoc = parser.parseFromString(data, 'text/html');

      // Find the table containing the cost of living data
      var table = htmlDoc.querySelector('table.data_wide_table');

      if (table) {
        // Find all the rows in the table
        var rows = table.querySelectorAll('tr');

        // Initialize variables to hold the total expenses and number of items
        var totalExpenses = 0;
        var currencySymbol = '';

        // Loop through each row in the table
        for (var i = 1; i < rows.length; i++) {
          // Find the columns in the row
          var cols = rows[i].querySelectorAll('td');

          // Check if the row contains cost of living data
          if (cols.length === 3) {
            // Get the name and cost of the item
            var itemCost = parseFloat(cols[1].textContent.trim().replace(currencySymbol, '').replace(',', ''));

            // Extract the currency symbol from the website
            if (currencySymbol === '') {
              currencySymbol = cols[1].querySelector('span').textContent.trim();
            }

            // Add the cost of the item to the total expenses
            totalExpenses += itemCost;
          }
        }

        // Calculate the average monthly cost of living
        var averageCostOfLiving = totalExpenses / (rows.length - 1);

        // Display the result under each job listing
        var costOfLivingDivs = document.querySelectorAll('.cost-of-living');
        costOfLivingDivs.forEach(div => {
          div.innerHTML = `
            <p><strong>Average Cost of Living:</strong> The average cost of living per person per month in ${country} is ${currencySymbol}${averageCostOfLiving.toFixed(2)}</p>
          `;
        });

      } else {
        throw new Error('Table not found');
      }
    })
    .catch(error => {
      console.error(error);
      alert('An error occurred while fetching the data. Please try again later.');
    });
}
