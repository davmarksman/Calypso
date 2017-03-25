import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import spark.ModelAndView;
import spark.template.freemarker.FreeMarkerEngine;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Invocation;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import static spark.Spark.*;

public class Main {

  public static void main(String[] args) {
    String port = System.getenv("PORT");
    if (port == null)
      port = "9002";
    staticFileLocation("/public");

    get("/hello", (req, res) -> "Hello World");

    get("/", (request, response) -> {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("message", "Hello World!");

        return new ModelAndView(attributes, "index.ftl");
    }, new FreeMarkerEngine());

    get("/api/search", (req, res) -> {
      String request = req.queryParams("q");
      String responseJson = "";
      try {
        String foodApiReq = "https://api.companieshouse.gov.uk/search/companies";
        Response data = makeRestCall(foodApiReq, request);
        responseJson = data.readEntity(String.class);
      }catch(Exception e){
        responseJson = e.toString();
      }

      return responseJson;
    });
  }


  public static Response makeRestCall(String url, String queryParams) throws Exception {
    Client client = ClientBuilder.newClient();

    WebTarget resource = client.target(url);

    Invocation.Builder request = resource.queryParam("q", queryParams).request();
    request.accept(MediaType.APPLICATION_JSON);
    request.header("Authorization", "Basic a3ctU3hsVzl0NVExbE9JdEdFMjJKNDVjLTdTUHFQUjB0UjI4dVZxbTo=");
    Response response = request.get();

    return response;
  }
}
