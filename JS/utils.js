let displayed_user = null

function display_loader(){
    const div = document.createElement('div');
    div.style = 'display:flex; justify-content:center;'
    div.innerHTML = `<img style='width:50px; margin-auto;' src='./assets/fade-loader.svg'/>`
    return div
}

async function display_header(octokit_ref, item){
    const container = document.getElementById('header')

    const user_details = await octokit_ref.request('GET /users/{username}',{
        username: item['login'],
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    console.log(user_details)

    const name = user_details['data']['name'] == null ? " " : user_details['data']['name'] 

    container.innerHTML =  `<div style="color:black; margin-right:10px; padding:4px">
                            <h2 style="margin-bottom:0px; margin-top:4px ;color:black">${name}</h2>
                            <p style="margin-top:0px; color:#333; margin-bottom: 0px ;">${user_details['data']['login']}</p>
                            <a href="${user_details['data']['html_url']}">
                            <img style="height:3vh; border-radius:60%; background-color:white; margin:0px" src="./assets/logo.png">
                            </a>
                            </div>
                            <img style="height:10vh; border-radius:50%; margin-top:auto; margin-bottom:auto; margin-right: 20px; border: 2px solid white;" src="${item['avatar_url']}">`
}

export async function createSearchDiv(octokit_ref, response){
    const container = document.getElementById('searchResults');
    container.innerHTML = ''

    const array = response['items']
    await Promise.all(array.map(async (item) =>{
        console.log("here")
        const div = document.createElement('div');
        div.onclick = function(){
            var per_page_display = document.getElementById("per_page").value
            displayed_user = item
            retrieveRepos(octokit_ref, item, per_page_display, 1)
            document.getElementsByClassName("no-user")[0].style = 'display:none;'
            document.getElementsByClassName("repos")[0].style = 'display:block;'
        }
        div.className = 'searchCard'

        div.addEventListener('mouseover', function(){
            div.style.cursor="pointer"
            div.style.scale="1.02"
        })

        div.addEventListener('mouseout', function() {
            div.style.scale='1'; 
            div.style.cursor="default"
        });

        div.innerHTML = `<img src='./assets/fade-loader.svg'/>
                        <div class='search-details'>
                            <h3 style='font-size:3vh; margin-top:1vh; margin-bottom:0px;'>--</h3>
                            <p style='font-size:2vh; margin-top:0px;'>--</p>
                        </div>`
        container.appendChild(div);
        
        const user_details = await octokit_ref.request('GET /users/{username}',{
            username: item['login'],
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        var name = user_details['data']['name'] == null ? "--" : user_details['data']['name']
        name = name.length > 20 ? name.substring(0, 13) + ".." : name 
        console.log(user_details)

        div.innerHTML = `<img src='${item['avatar_url']}'/>
                        <div class='search-details'>
                            <h3 style='font-size:2.5vh; margin-top:1vh; margin-bottom:0px;'>${name}</h3>
                            <p style='font-size:2vh; margin-top:0px;'>${item['login']}</p>
                        </div>`
        container.appendChild(div); 
    }));

    if (array.length == 0){
        const div = document.createElement('div');
        div.style = 'flex-grow: 100; color: white;'
        div.innerHTML = '<p>No users found.</p>'
        container.appendChild(div);
    }

}

function languagesCards(languages){
    const container = document.createElement('div')
    container.className = 'languagesCards'

    languages.forEach(element => {
        const lanDiv = document.createElement('div')
        lanDiv.className = 'lanCard'
        lanDiv.innerHTML = `<p>${element}<p>`
        container.appendChild(lanDiv)
    });

    return container
}


async function displayRepos(octokit_ref, username, response){
    const container = document.getElementById('user-repos');
    container.innerHTML = ''

    await Promise.all(response.map(async (item) =>{
        const div = document.createElement('div')
        div.className = 'repos-card'

        var description;

        if(item['description']!=null){
             description = String(item['description']).length > 80 ? String(item['description']).substring(0, 80) + '...' : item['description'] 
        }
        else{
            description = 'No description'
        }
            
        const date = String(item['updated_at']).substring(0, 10);
        const name = String(item['name']).length > 40 ? String(item['name']).substring(0,40).replaceAll('_', " ") + ".." : String(item['name']).replaceAll('_', " ")
        div.innerHTML = `<img style='width:20vh;' src='./assets/tube-spinner.svg'/>`
        container.appendChild(div)
        const languages = await getLanguages(octokit_ref, username, item['name'])     

        div.innerHTML = `<h2>${name}</h2>
                        <p style='font-style:italic;'>${description}</p>
                        <p class='created'>${date}</p>`
        div.appendChild(languagesCards(languages))
        container.appendChild(div)
    }))

    if(response.length === 0){
        const div = document.createElement('div');
        div.style = 'flex-grow: 100; color:white;'
        div.innerHTML = '<p>No Repos.</p>'
        container.appendChild(div);
    }
}

export async function searchUsers(octokit_ref ,searchQuery, per_page_display, curr_page){
    const container = document.getElementById('searchResults');
    container.innerHTML = ''
    console.log(searchQuery)
    if (searchQuery === "") {
        const p = document.createElement('p')
        p.style = 'margin:auto; color:white;'
        p.innerText = 'Empty Search Query'
        container.append(p)
        return
    }
    container.appendChild(display_loader())
    try {
        const response = await octokit_ref.request('GET /search/users', {
            q: searchQuery,
            sort: "repositories",
            per_page: per_page_display,
            page: curr_page,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        const result = response.data;
        console.log(result);
        createSearchDiv(octokit_ref, result)
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function retrieveRepos(octokit_ref, user_details, per_page_display, curr_page){
    const user_repos_div = document.getElementById('user-repos')
    user_repos_div.innerHTML = ''
    user_repos_div.appendChild(display_loader())
    let user = user_details == null ? displayed_user : user_details
    display_header(octokit_ref, user)
    console.log(user)
    try {
        const response = await octokit_ref.request('GET /users/{username}/repos', {
            username: user['login'],
            per_page: per_page_display,
            page: curr_page,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        const result = response.data;
        console.log(result);
        displayRepos(octokit_ref, user['login'], result,)
    } catch (error) {
        console.error('Error', error)
        displayRepos(octokit_ref, user['login'], null)
    }
}


async function getLanguages(octokit_ref, username, repository){
    try {
        const response = await octokit_ref.request('GET /repos/{owner}/{repo}/languages', {
            owner: username,
            repo: repository,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
          })
        console.log(response.data)
        return Object.keys(response.data)
    } catch (error) {
        console.error(error)
    }
}



