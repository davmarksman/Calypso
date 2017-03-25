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

//    get("/", (request, response) -> {
//        Map<String, Object> attributes = new HashMap<>();
//        attributes.put("message", "Hello World!");
//
//        return new ModelAndView(attributes, "index.ftl");
//    }, new FreeMarkerEngine());

    get("/", (request, response) -> {
      response.redirect("index.html");
      return null;
    });

      // .../api/search?q="companyName"
    get("/api/search", (req, res) -> {
      String request = req.queryParams("q");
      String responseJson = "";
      try {
        String url = "https://api.companieshouse.gov.uk/search/companies";
        Response data = makeCompanyHouseRestCall(url, request);
        responseJson = data.readEntity(String.class);
      }catch(Exception e){
        responseJson = e.toString();
      }

      return responseJson;
    });

    get("/api/company", (req, res) -> {
      String companyNo = req.queryParams("companyNo");

      String filingHistoryUrl = "https://api.companieshouse.gov.uk/company/" + companyNo + "/filing-history";
      String companyInfoUrl = "https://api.companieshouse.gov.uk/company/" + companyNo;
      String officersUrl = "https://api.companieshouse.gov.uk/company/" + companyNo + "/officers";

     String responseJson = "";
      try {
        Response fillingHistory = makeCompanyHouseRestCall(filingHistoryUrl);
        responseJson = "{ \"filingHistory\": " + fillingHistory.readEntity(String.class) + ", ";
        Response companyInfo = makeCompanyHouseRestCall(companyInfoUrl);
        responseJson = responseJson + " \"companyInfo\": " + companyInfo.readEntity(String.class) + ",";
        Response officers = makeCompanyHouseRestCall(officersUrl);
        responseJson = responseJson + " \"officers\": " + officers.readEntity(String.class) + "}";
      }catch(Exception e){
        responseJson = e.toString();
      }

      return responseJson;
    });
  }

  public static Response makeCompanyHouseRestCall(String url, String queryParams) throws Exception {
    Client client = ClientBuilder.newClient();

    WebTarget resource = client.target(url);

    Invocation.Builder request = resource.queryParam("q", queryParams).request();
    request.accept(MediaType.APPLICATION_JSON);
    request.header("Authorization", "Basic a3ctU3hsVzl0NVExbE9JdEdFMjJKNDVjLTdTUHFQUjB0UjI4dVZxbTo=");
    Response response = request.get();

    return response;
  }

  public static Response makeCompanyHouseRestCall(String url) throws Exception {
    Client client = ClientBuilder.newClient();

    WebTarget resource = client.target(url);

    Invocation.Builder request = resource.request();
    request.accept(MediaType.APPLICATION_JSON);
    request.header("Authorization", "Basic a3ctU3hsVzl0NVExbE9JdEdFMjJKNDVjLTdTUHFQUjB0UjI4dVZxbTo=");
    Response response = request.get();

    return response;
  }

}
