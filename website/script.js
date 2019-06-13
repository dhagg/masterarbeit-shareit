var photos;

/**
* Updates listed photos from backend.
*/
function updatePhotos() {
  clearPhotoView();
  fetch(config.api + "photos", {
    method: "GET",
    mode: "cors",
    cache: "no-cache",
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(json) {
    photos = json.photos;

    photos.sort(function(a, b) {
      return (a.timestamp < b.timestamp) ? 1 : -1;
    });

    showPhotos();
  })
  .catch(function(error) {
    document.getElementById("content").innerText = "Could not connect to API";
  });
}

/**
* Removes all photos from view.
*/
function clearPhotoView() {
  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }
}

/**
* Inserts all or filterd photos to the view.
*/
function showPhotos(tag = false) {
  photos.forEach(function(photo) {
    const tags = 'tags' in photo ? photo.tags : [];
    if (!tag || tags.includes(tag)) {
      insertPhoto(config.photobucket + photo.url_compressed, config.photobucket + photo.url_original, tags);
    }
  });
}

/**
* Inserts the defined photo.
*/
function insertPhoto(compressed, uncompressed, tags = [], append = true) {
  const content = document.getElementById("content");
  const card = document.createElement("div");
  const link = document.createElement("a");
  const img = document.createElement("img");
  const tags_card = document.createElement("p");

  card.classList.add("card");
  tags_card.classList.add("tags");

  img.src = compressed;
  link.href = uncompressed;
  link.target = "_blank";

  tags.forEach(function(tag) {
    const tag_link = document.createElement("a");
    tag_link.innerText = tag;
    tag_link.addEventListener("click", function () {
      showFilterCard(true, tag);
      clearPhotoView();
      showPhotos(tag);
    }, false);
    tag_link.href = "#";
    tags_card.appendChild(tag_link);
  });

  link.appendChild(img);
  card.appendChild(link);
  card.appendChild(tags_card);
  if (append) {
    content.appendChild(card);
  } else {
    content.insertBefore(card, content.firstChild);
  }
}

/**
* Resets filtering of photos and shows all photos.
*/
function resetFilter() {
  showFilterCard(false);
  clearPhotoView();
  showPhotos();
}

/**
* Loads selected photo to the preview box.
*/
function previewPhoto() {
  const file = document.getElementById('upload_file').files[0];
  const preview = document.getElementById('upload_preview');
  const status = document.getElementById("upload_status");
  const reader = new FileReader();

  status.innerText = "";

  reader.addEventListener("load", function () {
    preview.src = reader.result;
  }, false);

  if (file) {
    reader.readAsDataURL(file);
    showUpload(true);
  } else {
    showUpload(false);
  }
}

/**
* Uploads selected photo to the backend.
*/
function uploadPhoto() {
  const file = document.getElementById('upload_file').files[0];
  const status = document.getElementById("upload_status");
  const reader = new FileReader();

  status.innerText = "";

  reader.addEventListener("load", function () {
    const body = { "base64String": reader.result.split(",")[1] };
    fetch(config.api + "upload", {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(myJson) {
        if ('message' in myJson && myJson.message == "Success") {
          updatePhotos();
          status.innerText = "Uploaded";
          document.getElementById('upload_file').value = "";
          showUpload(false);
        } else {
          var error = "Unknown Error. Try again later!";
          if ('errorMessage' in myJson) {
            error = myJson.errorMessage;
          }
          status.innerText = error;
        }
      })
      .catch(function(err) {
        status.innerText = "An error occured.";
      });
  }, false);

  if (file) {
    reader.readAsDataURL(file);
    status.innerText = "Uploading...";
  }
}

/**
* Displays/Hides the filter box.
*/
function showFilterCard(visible, tag = "") {
  document.getElementById("filter_card").style.display = visible ? "block" : "none";
  document.getElementById("filter_tag").innerText = tag;
}

/**
* Displays/Hides the preview fot the image to be uploaded.
*/
function showUpload(visible) {
  const preview = document.getElementById('upload_preview');
  const button = document.getElementById('upload_button');
  if (visible) {
    preview.style.display = "inline-block";
    button.style.display = "inline-block";
  } else {
    preview.src = "";
    preview.style.display = "none";
    button.style.display = "none";
  }
}
