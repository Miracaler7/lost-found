document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            alert("Login successful!");
            window.location.href = "homepage.html"; // change if needed
        } else {
            document.getElementById("errorMessage").textContent = data.message;
        }
    } catch (error) {
        document.getElementById("errorMessage").textContent = "Error connecting to server";
        console.error(error);
    }
});