import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [request, setRequest] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);
    try {
      const response = await axios(`${rootUrl}/users/${user}`);
      setGithubUser(response.data);

      const { login, followers_url } = response.data;

      const response2 = axios(`${rootUrl}/users/${login}/repos?per_page=100`);

      const response3 = axios(`${followers_url}?per_page=100`);

      Promise.allSettled([response2, response3]).then((result) => {
        const [repos, followers] = result;
        if (repos.status === "fulfilled") {
          setRepos(repos.value.data);
        }
        if (followers.status === "fulfilled") {
          setFollowers(followers.value.data);
        }
      });
    } catch (error) {
      console.log(error);
      toggleError(true, "there is no user with this username");
    }
    setIsLoading(false);
    chechRequest();
  };

  const chechRequest = async () => {
    try {
      const response = await axios(`${rootUrl}/rate_limit`);
      const { data } = response;
      let {
        rate: { remaining },
      } = data;

      setRequest(remaining);
      if (remaining === 0) {
        toggleError(true, "sorry, you have exceeded your hourly rate limit!");
      }

      console.log(response);
      console.log(remaining);
    } catch (error) {
      console.log(error);
    }
  };

  const toggleError = (show = false, msg = "") => {
    setError({ show: show, msg: msg });
  };

  useEffect(() => {
    chechRequest();
  }, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        request,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
